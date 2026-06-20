<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('saver_plans')) {
            return;
        }

        Schema::create('saver_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // Up account id of the Saver this plan targets.
            $table->string('up_account_id');
            // Cached Saver display name so pay cycles can label transfers
            // without calling the Up API.
            $table->string('name')->nullable();
            $table->decimal('target_amount', 12, 2)->nullable();
            // Amount transferred to the Saver each pay cycle.
            $table->decimal('contribution_amount', 12, 2)->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'up_account_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('saver_plans');
    }
};
