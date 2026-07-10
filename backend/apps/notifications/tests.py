import pytest

from apps.tasks.models import Task
from apps.notifications.models import Notification
from apps.projects.models import Membership

pytestmark = pytest.mark.django_db


class TestNotificationTriggers:

    def test_assigning_task_notifies_assignee(self, auth_client, other_user, project):
        Membership.objects.create(project=project, user=other_user)

        response = auth_client.post(
            f'/api/v1/projects/{project.id}/tasks/',
            {'title': 'Tarea asignada', 'assigned_to_id': other_user.id},
            format='json',
        )

        assert response.status_code == 201
        notification = Notification.objects.get(recipient=other_user)
        assert notification.notification_type == Notification.Type.TASK_ASSIGNED
        assert notification.related_task_id == response.data['id']

    def test_self_assignment_does_not_notify(self, auth_client, user, project):
        # notify() ignora el caso recipient == actor: no tiene sentido
        # avisarte a vos mismo que te asignaste algo.
        response = auth_client.post(
            f'/api/v1/projects/{project.id}/tasks/',
            {'title': 'Tarea propia', 'assigned_to_id': user.id},
            format='json',
        )

        assert response.status_code == 201
        assert not Notification.objects.filter(recipient=user).exists()

    def test_completing_task_notifies_creator(self, auth_client, other_user, project):
        Membership.objects.create(project=project, user=other_user)
        task = Task.objects.create(project=project, title='Tarea', created_by=other_user)
        url = f'/api/v1/projects/{project.id}/tasks/{task.id}/change-status/'

        auth_client.patch(url, {'status': 'done'}, format='json')

        notification = Notification.objects.get(recipient=other_user)
        assert notification.notification_type == Notification.Type.TASK_COMPLETED

    def test_adding_member_notifies_new_member(self, auth_client, other_user, project):
        response = auth_client.post(
            f'/api/v1/projects/{project.id}/members/',
            {'user_id': other_user.id},
            format='json',
        )

        assert response.status_code == 201
        notification = Notification.objects.get(recipient=other_user)
        assert notification.notification_type == Notification.Type.MEMBER_ADDED


class TestNotificationEndpoints:

    def test_user_only_sees_own_notifications(self, auth_client, user, other_user):
        Notification.objects.create(
            recipient=user, notification_type=Notification.Type.MEMBER_ADDED, message='a'
        )
        Notification.objects.create(
            recipient=other_user, notification_type=Notification.Type.MEMBER_ADDED, message='b'
        )

        response = auth_client.get('/api/v1/notifications/')

        assert response.status_code == 200
        assert len(response.data['results']) == 1

    def test_mark_read(self, auth_client, user):
        notification = Notification.objects.create(
            recipient=user, notification_type=Notification.Type.MEMBER_ADDED, message='a'
        )

        response = auth_client.patch(f'/api/v1/notifications/{notification.id}/mark-read/')

        assert response.status_code == 200
        notification.refresh_from_db()
        assert notification.is_read is True

    def test_mark_all_read(self, auth_client, user):
        Notification.objects.create(
            recipient=user, notification_type=Notification.Type.MEMBER_ADDED, message='a'
        )
        Notification.objects.create(
            recipient=user, notification_type=Notification.Type.MEMBER_ADDED, message='b'
        )

        response = auth_client.post('/api/v1/notifications/mark-all-read/')

        assert response.status_code == 200
        assert response.data['updated'] == 2
        assert not Notification.objects.filter(recipient=user, is_read=False).exists()

    def test_cannot_mark_other_users_notification_as_read(self, auth_client, other_user):
        notification = Notification.objects.create(
            recipient=other_user, notification_type=Notification.Type.MEMBER_ADDED, message='a'
        )

        response = auth_client.patch(f'/api/v1/notifications/{notification.id}/mark-read/')

        # get_queryset() ya filtra por recipient=request.user, así que
        # una notificación ajena ni siquiera se encuentra: 404, no 403.
        assert response.status_code == 404
