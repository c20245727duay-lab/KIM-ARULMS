<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leases', function (Blueprint $table) {
            $table->id();

            $table->foreignId('tenant_id')
                ->constrained()
                ->onDelete('restrict');

            $table->foreignId('apartment_unit_id')
                ->constrained()
                ->onDelete('restrict');

            $table->decimal('security_deposit', 10, 2);
            $table->date('lease_start');
            $table->date('lease_end');
            $table->string('payment_status')->default('Unpaid');
            $table->timestamps();

            $table->index(['tenant_id', 'apartment_unit_id']);
            $table->index('lease_start');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leases');
    }
};