<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('leases')) {
            return;
        }

        Schema::create('leases', function (Blueprint $table) {
            $table->id('lease_id');

            $table->foreignId('tenant_id')
                ->constrained('tenants', 'tenant_id')
                ->onDelete('restrict');

            $table->foreignId('apartment_unit_id')
                ->constrained('apartment_units', 'apartment_unit_id')
                ->onDelete('restrict');

            $table->decimal('monthly_rent', 10, 2);
            $table->decimal('security_deposit', 10, 2);

            $table->date('lease_start');
            $table->date('lease_end');

            $table->timestamps();

            $table->index(['tenant_id', 'apartment_unit_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leases');
    }
};