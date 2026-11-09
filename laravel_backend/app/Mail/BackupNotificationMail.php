<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Queue\SerializesModels;

class BackupNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $status;
    public $type;
    public $filePath;
    public $error;
    public $cloudUrl;

    /**
     * Create a new message instance.
     */
    public function __construct($status, $type, $filePath = null, $error = null, $cloudUrl = null)
    {
        $this->status = $status;
        $this->type = $type;
        $this->filePath = $filePath;
        $this->error = $error;
        $this->cloudUrl = $cloudUrl;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Backup " . ucfirst($this->status) . ": " . ucfirst($this->type),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.backup_notification',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        if ($this->status === 'success' && $this->filePath && file_exists($this->filePath)) {
            // Only attach if file size is reasonable for email (e.g. < 20MB)
            if (filesize($this->filePath) < 20 * 1024 * 1024) {
                return [
                    Attachment::fromPath($this->filePath)
                ];
            }
        }
        return [];
    }
}
