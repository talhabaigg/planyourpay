<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;

/**
 * Thin client for the Up Banking API (https://developer.up.com.au).
 *
 * The Up API is read-only for money: it exposes balances and transactions
 * but has no endpoint to move funds between accounts. This service therefore
 * only reads data.
 */
class UpBankService
{
    public function __construct(
        protected ?string $token,
        protected string $base,
    ) {}

    public static function fromConfig(): self
    {
        return new self(
            config('services.up.token'),
            rtrim((string) config('services.up.base'), '/'),
        );
    }

    /**
     * Build a client for a user's stored token, falling back to the env token.
     */
    public static function forUser(?User $user): self
    {
        $token = null;

        if ($user && Schema::hasColumn('users', 'up_api_token')) {
            $token = $user->up_api_token;
        }

        return new self(
            $token ?: config('services.up.token'),
            rtrim((string) config('services.up.base'), '/'),
        );
    }

    /**
     * Build a client for an explicit token (used to verify before saving).
     */
    public static function withToken(string $token): self
    {
        return new self($token, rtrim((string) config('services.up.base'), '/'));
    }

    public function isConfigured(): bool
    {
        return filled($this->token);
    }

    protected function client(): PendingRequest
    {
        return Http::withToken($this->token)
            ->baseUrl($this->base)
            ->acceptJson()
            ->timeout(15);
    }

    /**
     * Verify the token is valid.
     */
    public function ping(): bool
    {
        return $this->client()->get('/util/ping')->successful();
    }

    /**
     * Saver accounts with their current balances, largest first.
     *
     * @return array<int, array{id: string, name: string, balance: float}>
     */
    public function savers(): array
    {
        $response = $this->client()->get('/accounts', [
            'filter[accountType]' => 'SAVER',
            'page[size]' => 100,
        ]);

        $response->throw();

        return collect($response->json('data', []))
            ->map(fn (array $account) => [
                'id' => $account['id'],
                'name' => $account['attributes']['displayName'] ?? 'Saver',
                'balance' => (float) ($account['attributes']['balance']['value'] ?? 0),
            ])
            ->sortByDesc('balance')
            ->values()
            ->all();
    }

    /**
     * Total available balance across spending (transactional) accounts.
     */
    public function spendingBalance(): float
    {
        $response = $this->client()->get('/accounts', [
            'filter[accountType]' => 'TRANSACTIONAL',
            'page[size]' => 100,
        ]);

        $response->throw();

        return collect($response->json('data', []))
            ->sum(fn (array $a) => (float) ($a['attributes']['balance']['value'] ?? 0));
    }
}
