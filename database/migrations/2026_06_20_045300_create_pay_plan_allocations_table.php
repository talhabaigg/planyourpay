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
        Schema::create('pay_plan_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pay_plan_id')->constrained()->cascadeOnDelete();
            $table->foreignId('commitment_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('type', ['inflow', 'outflow'])->default('outflow');
            $table->string('label');
            $table->decimal('amount', 12, 2);
            $table->enum('status', ['planned', 'paid', 'skipped'])->default('planned');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pay_plan_allocations');
    }
};
