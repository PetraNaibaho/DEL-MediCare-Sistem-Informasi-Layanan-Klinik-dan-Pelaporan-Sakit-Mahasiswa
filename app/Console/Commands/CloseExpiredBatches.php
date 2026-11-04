<?php

namespace App\Console\Commands;

use App\Services\BatchingService;
use Illuminate\Console\Command;

class CloseExpiredBatches extends Command
{
    protected $signature = 'medicare:close-batches';

    protected $description = 'Tutup batch penjemputan yang window waktunya sudah habis';

    public function handle(BatchingService $batching): int
    {
        $count = $batching->closeExpired();

        $this->info("{$count} batch ditutup.");

        return self::SUCCESS;
    }
}
