import pytest

from apps.tasks.models import Task

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
