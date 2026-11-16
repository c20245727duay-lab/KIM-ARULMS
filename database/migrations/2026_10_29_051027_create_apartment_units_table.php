<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('apartment_units')) {
            return;
        }

        Schema::create('apartment_units', function (Blueprint $table) {
            $table->id('apartment_unit_id');

            $table->foreignId('building_id')
                ->constrained('buildings', 'building_id')
                ->onDelete('restrict');

            $table->string('unit_number');
            $table->decimal('monthly_rent', 10, 2);
            $table->enum('status', [
                'Vacant',
                'Occupied',
                'Maintenance'
            ])->default('Vacant');
            $table->timestamps();

            $table->unique(['building_id', 'unit_number']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('apartment_units');
    }
};