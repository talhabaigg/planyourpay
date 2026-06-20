<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('saver_plans')) {
            return;
        }

        Schema::table('saver_plans', function (Blueprint $table) {
            if (! Schema::hasColumn('saver_plans', 'target_date')) {
                $table->date('target_date')->nullable()->after('target_amount');
            }
        });
    }

    public function down(): void
    {
        if (Schema::hasTable('saver_plans') && Schema::hasColumn('saver_plans', 'target_date')) {
            Schema::table('saver_plans', function (Blueprint $table) {
                $table->dropColumn('target_date');
            });
        }
    }
};
