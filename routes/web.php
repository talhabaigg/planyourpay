<?php

use App\Http\Controllers\AllocationCoverController;
use App\Http\Controllers\CommitmentController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PayCycleController;
use App\Http\Controllers\PayPlanAllocationController;
use App\Http\Controllers\PayScheduleController;
use App\Http\Controllers\SaverController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
});

Route::middleware(['auth'])->group(function () {
    Route::resource('pay-schedules', PayScheduleController::class)->except(['show']);
    Route::get('pay-cycles', [PayCycleController::class, 'index'])->name('pay-cycles.index');
    Route::post('pay-plans/{payPlan}/allocations', [PayPlanAllocationController::class, 'store'])->name('pay-plan-allocations.store');
    Route::post('pay-plans/{payPlan}/saver-transfers/{saverPlan}', [PayPlanAllocationController::class, 'materializeSaver'])->name('pay-plan-allocations.saver');
    Route::put('pay-plan-allocations/{allocation}', [PayPlanAllocationController::class, 'update'])->name('pay-plan-allocations.update');
    Route::delete('pay-plan-allocations/{allocation}', [PayPlanAllocationController::class, 'destroy'])->name('pay-plan-allocations.destroy');
    Route::resource('commitments', CommitmentController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::post('pay-plan-allocations/{allocation}/covers', [AllocationCoverController::class, 'store'])->name('allocation-covers.store');
    Route::put('allocation-covers/{allocationCover}', [AllocationCoverController::class, 'update'])->name('allocation-covers.update');
    Route::delete('allocation-covers/{allocationCover}', [AllocationCoverController::class, 'destroy'])->name('allocation-covers.destroy');
    Route::get('savers', [SaverController::class, 'index'])->name('savers.index');
    Route::post('savers/connect', [SaverController::class, 'connect'])->name('savers.connect');
    Route::delete('savers/disconnect', [SaverController::class, 'disconnect'])->name('savers.disconnect');
    Route::post('savers/{account}/plan', [SaverController::class, 'savePlan'])->name('savers.plan.save');
    Route::delete('savers/{account}/plan', [SaverController::class, 'deletePlan'])->name('savers.plan.delete');
});

require __DIR__.'/settings.php';
