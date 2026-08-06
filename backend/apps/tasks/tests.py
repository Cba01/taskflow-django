import pytest

from apps.tasks.models import Task
from apps.projects.models import Membership

pytestmark = pytest.mark.django_db


class TestTaskAccess:

    def test_member_can_list_tasks(self, auth_client, project):
        response = auth_client.get(f'/api/v1/projects/{project.id}/tasks/')

        assert response.status_code == 200

    def test_non_member_gets_403(self, api_client, other_user, project):
        # A diferencia de Project (que usa 404), aquí el proyecto se busca
        # sin filtrar y la membresía se chequea a mano en la view,
        # por eso el resultado es 403 y no 404.
        api_client.force_authenticate(user=other_user)
        response = api_client.get(f'/api/v1/projects/{project.id}/tasks/')

        assert response.status_code == 403


class TestTaskCreation:

    def test_create_task_sets_project_and_created_by(self, auth_client, user, project):
        response = auth_client.post(
            f'/api/v1/projects/{project.id}/tasks/',
            {'title': 'Escribir tests'},
            format='json',
        )

        assert response.status_code == 201
        task = Task.objects.get(id=response.data['id'])
        assert task.project == project
        assert task.created_by == user


class TestTaskEdit:

    def test_creator_can_update_task(self, auth_client, user, project):
        task = Task.objects.create(project=project, title='Tarea', created_by=user)
        url = f'/api/v1/projects/{project.id}/tasks/{task.id}/'

        response = auth_client.patch(url, {'title': 'Tarea editada'}, format='json')

        assert response.status_code == 200
        task.refresh_from_db()
        assert task.title == 'Tarea editada'

    def test_assignee_can_update_task(self, api_client, other_user, project):
        Membership.objects.create(project=project, user=other_user, role=Membership.Role.MEMBER)
        task = Task.objects.create(project=project, title='Tarea')
        task.assigned_to.add(other_user)
        api_client.force_authenticate(user=other_user)

        response = api_client.patch(
            f'/api/v1/projects/{project.id}/tasks/{task.id}/',
            {'title': 'Tarea editada'},
            format='json',
        )

        assert response.status_code == 200

    def test_uninvolved_member_cannot_update_task(self, api_client, other_user, project):
        Membership.objects.create(project=project, user=other_user, role=Membership.Role.MEMBER)
        task = Task.objects.create(project=project, title='Tarea')
        api_client.force_authenticate(user=other_user)

        response = api_client.patch(
            f'/api/v1/projects/{project.id}/tasks/{task.id}/',
            {'title': 'Tarea editada'},
            format='json',
        )

        assert response.status_code == 403
        task.refresh_from_db()
        assert task.title == 'Tarea'


class TestTaskDelete:

    def test_creator_can_delete_task(self, auth_client, user, project):
        task = Task.objects.create(project=project, title='Tarea', created_by=user)

        response = auth_client.delete(f'/api/v1/projects/{project.id}/tasks/{task.id}/')

        assert response.status_code == 204
        assert not Task.objects.filter(id=task.id).exists()

    def test_admin_can_delete_task_created_by_someone_else(self, auth_client, other_user, project):
        Membership.objects.create(project=project, user=other_user, role=Membership.Role.MEMBER)
        task = Task.objects.create(project=project, title='Tarea', created_by=other_user)

        response = auth_client.delete(f'/api/v1/projects/{project.id}/tasks/{task.id}/')

        assert response.status_code == 204

    def test_assignee_who_is_not_creator_cannot_delete_task(self, api_client, other_user, project):
        # A diferencia de editar, ser el asignado no alcanza para borrar.
        Membership.objects.create(project=project, user=other_user, role=Membership.Role.MEMBER)
        task = Task.objects.create(project=project, title='Tarea')
        task.assigned_to.add(other_user)
        api_client.force_authenticate(user=other_user)

        response = api_client.delete(f'/api/v1/projects/{project.id}/tasks/{task.id}/')

        assert response.status_code == 403
        assert Task.objects.filter(id=task.id).exists()


class TestChangeStatus:

    def test_change_status_updates_task(self, auth_client, project):
        task = Task.objects.create(project=project, title='Tarea')
        url = f'/api/v1/projects/{project.id}/tasks/{task.id}/change-status/'

        response = auth_client.patch(url, {'status': 'done'}, format='json')

        assert response.status_code == 200
        task.refresh_from_db()
        assert task.status == 'done'

    def test_change_status_rejects_invalid_value(self, auth_client, project):
        task = Task.objects.create(project=project, title='Tarea')
        url = f'/api/v1/projects/{project.id}/tasks/{task.id}/change-status/'

        response = auth_client.patch(url, {'status': 'no-existe'}, format='json')

        assert response.status_code == 400
