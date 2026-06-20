<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('pay_plan_allocations')) {
            return;
        }

        Schema::table('pay_plan_allocations', function (Blueprint $table) {
            if (! Schema::hasColumn('pay_plan_allocations', 'saver_plan_id')) {
                // Set when an allocation records an actual transfer for a Saver
                // plan in a given pay cycle.
                $table->unsignedBigInteger('saver_plan_id')->nullable()->after('commitment_id');
            }
        });
    }

    public function down(): void
    {
        if (Schema::hasTable('pay_plan_allocations') && Schema::hasColumn('pay_plan_allocations', 'saver_plan_id')) {
            Schema::table('pay_plan_allocations', function (Blueprint $table) {
                $table->dropColumn('saver_plan_id');
            });
        }
    }
};
