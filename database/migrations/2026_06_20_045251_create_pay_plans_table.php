<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pay_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('pay_schedule_id')->nullable()->constrained()->nullOnDelete();
            $table->date('period_start_date');
            $table->date('period_end_date');
            $table->decimal('total_income', 12, 2)->default(0);
            $table->text('notes')->nullable();
            $table->boolean('locked')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['user_id', 'period_start_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pay_plans');
    }
};
