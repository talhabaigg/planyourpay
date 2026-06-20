<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'pay_schedule_id',
        'period_start_date',
        'period_end_date',
        'total_income',
        'notes',
        'locked',
    ];

    protected $casts = [
        'period_start_date' => 'date',
        'period_end_date' => 'date',
        'total_income' => 'decimal:2',
        'locked' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function schedule()
    {
        return $this->belongsTo(PaySchedule::class, 'pay_schedule_id');
    }

    public function allocations()
    {
        return $this->hasMany(PayPlanAllocation::class);
    }
}
