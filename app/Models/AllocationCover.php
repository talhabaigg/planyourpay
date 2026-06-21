<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AllocationCover extends Model
{
    use HasFactory;

    protected $fillable = [
        'pay_plan_allocation_id',
        'source',
        'saver_plan_id',
        'amount',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    /** @return BelongsTo<PayPlanAllocation, $this> */
    public function allocation(): BelongsTo
    {
        return $this->belongsTo(PayPlanAllocation::class, 'pay_plan_allocation_id');
    }

    /** @return BelongsTo<SaverPlan, $this> */
    public function saverPlan(): BelongsTo
    {
        return $this->belongsTo(SaverPlan::class);
    }
}
