import pytest

from apps.projects.models import Project, Membership

pytestmark = pytest.mark.django_db


class TestProjectCreation:

    def test_create_project_sets_owner_and_admin_membership(self, auth_client, user):
        response = auth_client.post(
            '/api/v1/projects/', {'name': 'Nuevo Proyecto'}, format='json'
        )

        assert response.status_code == 201
        project = Project.objects.get(id=response.data['id'])
        assert project.owner == user
        assert Membership.objects.filter(
            project=project, user=user, role=Membership.Role.ADMIN
        ).exists()


class TestProjectAccess:

    def test_owner_can_retrieve_project(self, auth_client, project):
        response = auth_client.get(f'/api/v1/projects/{project.id}/')

        assert response.status_code == 200

    def test_non_member_gets_404(self, api_client, other_user, project):
        # Un usuario que no es dueño ni miembro no debería poder
        # ni siquiera confirmar que el proyecto existe.
        api_client.force_authenticate(user=other_user)
        response = api_client.get(f'/api/v1/projects/{project.id}/')

        assert response.status_code == 404

    def test_list_only_returns_own_projects(self, api_client, other_user, project):
        api_client.force_authenticate(user=other_user)
        response = api_client.get('/api/v1/projects/')

        ids = [item['id'] for item in response.data['results']]
        assert project.id not in ids


class TestProjectMembers:

    def test_admin_can_remove_member(self, auth_client, other_user, project):
        membership = Membership.objects.create(project=project, user=other_user)

        response = auth_client.delete(f'/api/v1/projects/{project.id}/members/{membership.id}/')

        assert response.status_code == 204
        assert not Membership.objects.filter(id=membership.id).exists()

    def test_non_admin_cannot_remove_member(self, api_client, user, other_user, project):
        # other_user es miembro simple (no admin) del proyecto de `user`.
        # `project` ya crea la membresía admin de `user` (el owner); la usamos
        # como objetivo de la remoción intentada.
        Membership.objects.create(project=project, user=other_user, role=Membership.Role.MEMBER)
        target = Membership.objects.get(project=project, user=user)
        api_client.force_authenticate(user=other_user)

        response = api_client.delete(f'/api/v1/projects/{project.id}/members/{target.id}/')

        assert response.status_code == 403
        assert Membership.objects.filter(id=target.id).exists()

    def test_cannot_remove_owner(self, auth_client, user, project):
        owner_membership = Membership.objects.get(project=project, user=user)

        response = auth_client.delete(
            f'/api/v1/projects/{project.id}/members/{owner_membership.id}/'
        )

        assert response.status_code == 400
        assert Membership.objects.filter(id=owner_membership.id).exists()

    def test_removing_nonexistent_membership_returns_404(self, auth_client, project):
        response = auth_client.delete(f'/api/v1/projects/{project.id}/members/9999/')

        assert response.status_code == 404
