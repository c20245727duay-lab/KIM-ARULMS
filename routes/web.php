<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::get('apartment-units', fn () => Inertia::render('apartment-units'))
        ->name('apartment-units.index');
    Route::get('leases', fn () => Inertia::render('leases'))
        ->name('leases.index');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
