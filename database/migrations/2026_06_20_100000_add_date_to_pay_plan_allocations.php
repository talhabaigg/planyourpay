<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pay_plan_allocations', function (Blueprint $table) {
            if (! Schema::hasColumn('pay_plan_allocations', 'date')) {
                $table->date('date')->nullable()->after('amount');
            }
        });
    }

    public function down(): void
    {
        Schema::table('pay_plan_allocations', function (Blueprint $table) {
            if (Schema::hasColumn('pay_plan_allocations', 'date')) {
                $table->dropColumn('date');
            }
        });
    }
};
