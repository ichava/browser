<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\Browser\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

/**
 * Injects Ichava npm build scripts into the host application's package.json.
 */
class InjectNpmScriptsCommand extends Command
{
    protected $signature = 'ichava:inject-scripts
                            {--path= : Absolute path to the host package.json (default: base_path)}
                            {--force : Re-inject scripts even if they already exist}';

    protected $description = 'Inject Ichava npm build/watch scripts into the host application package.json';

    private const SCRIPTS = [
        '// Package: Ichava' => '',
        'ichava:build' => 'cd vendor/ichava/ichava && npm run build --silent',
        'ichava:build:prod' => 'cd vendor/ichava/ichava && npm run build:prod --silent',
        'ichava:watch' => 'cd vendor/ichava/ichava && npm run watch --silent',
    ];

    public function handle(): int
    {
        $path = $this->option('path') ?: base_path('package.json');

        if (! File::exists($path)) {
            $this->error("package.json not found at: {$path}");

            return self::FAILURE;
        }

        $contents = File::get($path);
        $data = json_decode($contents, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->error('Could not parse package.json: '.json_last_error_msg());

            return self::FAILURE;
        }

        if (! isset($data['scripts'])) {
            $data['scripts'] = [];
        }

        $force = $this->option('force');
        $added = [];

        foreach (self::SCRIPTS as $key => $value) {
            if ($force || ! array_key_exists($key, $data['scripts'])) {
                $data['scripts'][$key] = $value;
                $added[] = $key;
            }
        }

        if (empty($added)) {
            $this->info('Ichava npm scripts already present, nothing to do. Use --force to overwrite.');

            return self::SUCCESS;
        }

        File::put(
            $path,
            json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)."\n"
        );

        $this->info('Ichava npm scripts injected into package.json:');
        foreach ($added as $key) {
            $this->line("  <fg=green>+</> {$key}");
        }

        return self::SUCCESS;
    }
}
