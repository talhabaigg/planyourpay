<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaverPlan extends Model
{
    protected $fillable = [
        'user_id',
        'up_account_id',
        'name',
        'target_amount',
        'target_date',
        'contribution_amount',
    ];

    protected $casts = [
        'target_amount' => 'decimal:2',
        'target_date' => 'date',
        'contribution_amount' => 'decimal:2',
    ];

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
