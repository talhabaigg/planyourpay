<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;

class PayPlan extends Model
{
    use HasFactory, SoftDeletes;

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

    protected static function booted(): void
    {
        static::addGlobalScope('user', function (Builder $builder) {
            if ($userId = Auth::id()) {
                $builder->where('user_id', $userId);
            }
        });

        static::creating(function ($model) {
            if (!$model->user_id && Auth::id()) {
                $model->user_id = Auth::id();
            }
        });
    }

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
