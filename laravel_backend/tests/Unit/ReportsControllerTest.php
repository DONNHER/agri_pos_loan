<?php

namespace Tests\Unit;

use App\Http\Controllers\Api\ReportsController;
use App\Services\ReportService;
use Illuminate\Http\Request;
use Tests\TestCase;

class ReportsControllerTest extends TestCase
{
    public function test_index_returns_available_reports(): void
    {
        $controller = new ReportsController(app(ReportService::class));
        $response = $controller->index();

        $this->assertSame(200, $response->getStatusCode());

        $payload = json_decode($response->getContent(), true);
        $this->assertTrue($payload['success']);
        $this->assertNotEmpty($payload['reports']);
        $this->assertContains($payload['reports'], fn ($report) => $report['key'] === 'user_activity');
    }

    public function test_generate_returns_download_and_email_options(): void
    {
        $controller = new ReportsController(app(ReportService::class));
        $request = Request::create('/api/reports/generate', 'POST', [
            'report_type' => 'user_activity',
            'format' => 'pdf',
        ]);

        $response = $controller->generate($request);
        $payload = json_decode($response->getContent(), true);

        $this->assertTrue($payload['success']);
        $this->assertSame('pdf', $payload['format']);
        $this->assertArrayHasKey('delivery_options', $payload);
        $this->assertTrue($payload['delivery_options']['download']);
        $this->assertTrue($payload['delivery_options']['email']);
    }
}
