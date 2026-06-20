<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayPlanAllocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'pay_plan_id',
        'commitment_id',
        'type',
        'label',
        'amount',
        'status',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function plan()
    {
        return $this->belongsTo(PayPlan::class, 'pay_plan_id');
    }

    public function commitment()
    {
        return $this->belongsTo(Commitment::class);
    }
}
