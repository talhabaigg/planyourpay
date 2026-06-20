<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaySchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'amount',
        'cadence',
        'recurrence_interval',
        'next_pay_date',
        'day_of_week',
        'day_of_month',
        'is_primary',
        'active',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'next_pay_date' => 'date',
        'is_primary' => 'boolean',
        'active' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function payPlans()
    {
        return $this->hasMany(PayPlan::class);
    }
}
