<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PayScheduleController;
use App\Http\Controllers\CommitmentController;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

Route::middleware(['auth'])->group(function () {
    Route::resource('pay-schedules', PayScheduleController::class)->except(['show']);
    Route::get('pay-cycles', [\App\Http\Controllers\PayCycleController::class, 'index'])->name('pay-cycles.index');
    Route::resource('commitments', CommitmentController::class)->only(['index', 'store', 'update', 'destroy']);
});

require __DIR__.'/settings.php';
