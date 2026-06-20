<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PayScheduleController;
use App\Http\Controllers\PayPlanAllocationController;
use App\Http\Controllers\CommitmentController;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
});

Route::middleware(['auth'])->group(function () {
    Route::resource('pay-schedules', PayScheduleController::class)->except(['show']);
    Route::get('pay-cycles', [\App\Http\Controllers\PayCycleController::class, 'index'])->name('pay-cycles.index');
    Route::post('pay-plans/{