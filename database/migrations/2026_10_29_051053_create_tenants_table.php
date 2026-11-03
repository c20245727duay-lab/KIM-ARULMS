<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_name');
            $table->string('tenant_email')->unique();
            $table->string('tenant_phone', 30);
            $table->timestamps();

            $table->index('tenant_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};