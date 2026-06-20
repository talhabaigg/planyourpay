<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;

class PaySchedule extends Model
{
    use HasFactory, SoftDeletes;

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

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function payPlans()
    {
        return $this->hasMany(PayPlan::class);
    }
}
