<?php

namespace App\Models;

use Database\Factories\CommitmentFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;

class Commitment extends Model
{
    /** @use HasFactory<CommitmentFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'name',
        'amount',
        'recurrence_type',
        'recurrence_interval',
        'first_due_date',
        'category',
        'notes',
        'active',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'first_due_date' => 'date',
        'active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::addGlobalScope('user', function (Builder $builder) {
            if ($userId = Auth::id()) {
                $builder->where('user_id', $userId);
            }
        });

        static::creating(function ($model) {
            if (! $model->user_id && Auth::id()) {
                $model->user_id = Auth::id();
            }
        });
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<PayPlanAllocation, $this> */
    public function allocations(): HasMany
    {
        return $this->hasMany(PayPlanAllocation::class);
    }
}
