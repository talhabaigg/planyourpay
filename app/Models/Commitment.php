<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Commitment extends Model
{
    use HasFactory;

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

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function allocations()
    {
        return $this->hasMany(PayPlanAllocation::class);
    }
}
