<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('allocation_covers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pay_plan_allocation_id')->constrained()->cascadeOnDelete();
            $table->enum('source', ['saver', 'paycheck']);
            $table->foreignId('saver_plan_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('amount', 12, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('allocation_covers');
    }
};
