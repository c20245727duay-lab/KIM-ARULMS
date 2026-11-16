<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('utility_bills')) {
            return;
        }

        Schema::create('utility_bills', function (Blueprint $table) {
            $table->id('utility_bill_id');

            $table->foreignId('lease_id')
                ->constrained('leases', 'lease_id')
                ->onDelete('cascade');

            $table->decimal('utility_charge', 10, 2)
                ->default(0);

            $table->decimal('total_due', 10, 2)
                ->default(0);

            $table->enum('payment_status', [
                'Pending',
                'Paid',
                'Overdue'
            ])->default('Pending');

            $table->timestamps();

            $table->index('payment_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('utility_bills');
    }
};