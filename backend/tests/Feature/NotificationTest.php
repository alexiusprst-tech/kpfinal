<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    protected User $userA;
    protected User $userB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->userA = User::create([
            'id'       => (string) Str::uuid(),
            'name'     => 'Dosen A',
            'email'    => 'dosena@telkomuniversity.ac.id',
            'password' => bcrypt('password'),
            'role'     => 'KOORDINATOR',
            'status'   => 'ACTIVE',
        ]);

        $this->userB = User::create([
            'id'       => (string) Str::uuid(),
            'name'     => 'Dosen B',
            'email'    => 'dosenb@telkomuniversity.ac.id',
            'password' => bcrypt('password'),
            'role'     => 'KOORDINATOR',
            'status'   => 'ACTIVE',
        ]);
    }

    public function test_user_can_mark_own_notification_as_read(): void
    {
        $notification = Notification::create([
            'id'      => (string) Str::uuid(),
            'user_id' => $this->userA->id,
            'title'   => 'Penugasan Baru',
            'message' => 'Anda ditugaskan sebagai koordinator.',
            'is_read' => false,
        ]);

        $response = $this->actingAs($this->userA)
            ->post(route('notifications.read', $notification->id));

        $response->assertRedirect();
        $this->assertTrue($notification->fresh()->is_read);
    }

    public function test_user_cannot_mark_another_users_notification_as_read(): void
    {
        $notification = Notification::create([
            'id'      => (string) Str::uuid(),
            'user_id' => $this->userB->id,
            'title'   => 'Penugasan Baru',
            'message' => 'Anda ditugaskan sebagai koordinator.',
            'is_read' => false,
        ]);

        $response = $this->actingAs($this->userA)
            ->post(route('notifications.read', $notification->id));

        $response->assertStatus(403);
        $this->assertFalse($notification->fresh()->is_read);
    }

    public function test_read_all_only_marks_the_authenticated_users_notifications(): void
    {
        $ownUnread = Notification::create([
            'id' => (string) Str::uuid(), 'user_id' => $this->userA->id,
            'title' => 'A1', 'message' => 'pesan 1', 'is_read' => false,
        ]);
        $otherUnread = Notification::create([
            'id' => (string) Str::uuid(), 'user_id' => $this->userB->id,
            'title' => 'B1', 'message' => 'pesan 1', 'is_read' => false,
        ]);

        $response = $this->actingAs($this->userA)->post(route('notifications.read-all'));

        $response->assertRedirect();
        $this->assertTrue($ownUnread->fresh()->is_read);
        $this->assertFalse($otherUnread->fresh()->is_read);
    }
}
