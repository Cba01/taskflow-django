import pytest
from rest_framework.test import APIClient

from apps.projects.models import Project, Membership


@pytest.fixture
def create_user(django_user_model):
    def _create_user(email, password='testpass123', **kwargs):
        username = kwargs.pop('username', email.split('@')[0])
        return django_user_model.objects.create_user(
            email=email, username=username, password=password, **kwargs
        )
    return _create_user


@pytest.fixture
def user(create_user):
    return create_user('owner@test.com')


@pytest.fixture
def other_user(create_user):
    return create_user('other@test.com')


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def auth_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def project(user):
    project = Project.objects.create(name='Proyecto de prueba', owner=user)
    Membership.objects.create(project=project, user=user, role=Membership.Role.ADMIN)
    return project
