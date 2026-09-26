<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\IconBrowser\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Simtabi\Laranail\Console\Tools\Widgets\StatusLine;
use Symfony\Component\Console\Formatter\OutputFormatter;
use Simtabi\Laranail\Console\Tools\Commands\Concerns\SupportsNamespacedNames;

/**
 * Injects Ichava npm build scripts into the host application's package.json.
 */
class InjectNpmScriptsCommand extends Command
{
    /*
     * Symfony's validateName() rejects the empty segment in `::`, so the
     * namespaced name cannot be registered through the normal path. This trait
     * writes it past that validator; dispatch still works because Symfony
     * resolves an exact name before its `:`-splitting namespace lookup.
     */
    use SupportsNamespacedNames;

    /**
     * Where Composer installs this package, which is `name` in composer.json.
     *
     * These scripts are written into the *host* application's package.json, so
     * nothing in this repository ever runs them -- which is how they went on
     * naming `vendor/ichava/ichava`, the pre-split monolith's install path, long
     * after the split renamed this package. `NpmScriptPathTest` pins this
     * constant to the manifest so a rename cannot quietly strand it again.
     */
    private const PACKAGE_DIR = 'vendor/ichava/icon-browser';

    private const SCRIPTS = [
        '// Package: Ichava' => '',
        'ichava:build'       => 'cd ' . self::PACKAGE_DIR . ' && npm run build --silent',
        'ichava:build:prod'  => 'cd ' . self::PACKAGE_DIR . ' && npm run build:prod --silent',
        'ichava:watch'       => 'cd ' . self::PACKAGE_DIR . ' && npm run watch --silent',
    ];

    protected $signature = 'ichava::icon-browser.inject-scripts
                            {--path= : Absolute path to the host package.json (default: base_path)}
                            {--force : Re-inject scripts even if they already exist}';

    protected $description = 'Inject Ichava npm build/watch scripts into the host application package.json';

    public function handle(): int
    {
        $path = $this->option('path') ?: base_path('package.json');

        if (! File::exists($path)) {
            $this->line(StatusLine::make()->error(__('ichava/icon-browser::commands.inject_scripts.not_found', ['path' => $path])));

            return self::FAILURE;
        }

        $contents = File::get($path);
        $data = json_decode($contents, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->line(StatusLine::make()->error(__('ichava/icon-browser::commands.inject_scripts.unparseable', ['error' => json_last_error_msg()])));

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
            $this->line(StatusLine::make()->info(__('ichava/icon-browser::commands.inject_scripts.already_present')));

            return self::SUCCESS;
        }

        File::put(
            $path,
            json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n",
        );

        $this->line(StatusLine::make()->success(__('ichava/icon-browser::commands.inject_scripts.injected')));
        foreach ($added as $key) {
            $this->line('  <fg=green>+</> ' . OutputFormatter::escape($key));
        }

        return self::SUCCESS;
    }
}
