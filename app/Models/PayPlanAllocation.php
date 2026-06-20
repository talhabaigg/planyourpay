<?php

namespace App\Models;

use Database\Factories\PayPlanAllocationFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PayPlanAllocation extends Model
{
    /** @use HasFactory<PayPlanAllocationFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'pay_plan_id',
        'commitment_id',
        'saver_plan_id',
        'type',
        'label',
        'amount',
        'date',
        'status',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'date' => 'date',
    ];

    /** @return BelongsTo<PayPlan, $this> */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(PayPlan::class, 'pay_plan_id');
    }

    /** @return BelongsTo<Commitment, $this> */
    public function commitment(): BelongsTo
    {
        return $this->belongsTo(Commitment::class);
    }
}
