from app.db import models

def test_create_item_admin(client, admin_headers):
    response = client.post(
        "/items/",
        json={"title": "Test Item", "description": "Test Desc", "price": 100, "quantity": 10},
        headers=admin_headers
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Test Item"

def test_create_item_manager_forbidden(client, manager_headers):
    response = client.post(
        "/items/",
        json={"title": "Test Item", "description": "Test Desc", "price": 100, "quantity": 10},
        headers=manager_headers
    )
    assert response.status_code == 403

def test_create_item_viewer_forbidden(client, user_headers):
    response = client.post(
        "/items/",
        json={"title": "Test Item", "description": "Test Desc", "price": 100, "quantity": 10},
        headers=user_headers
    )
    assert response.status_code == 403

def test_read_items_authenticated(client, user_headers):
    response = client.get("/items/", headers=user_headers)
    assert response.status_code == 200

def test_update_quantity_manager(client, manager_headers):
    # First create item as admin
    # We need a token for admin to create item
    # But fixtures use separate DB sessions? No, function scope db fixture shares session.
    # Wait, client fixture likely resets DB?
    # conftest.py: db fixture yields session, drops tables after. scope="function".
    # So we need to create item within this test or use a fixture.
    # We'll creating it using admin headers helper if available, or just mocking?
    # Better to just insert into DB directly or use admin client.
    pass

def test_admin_access_audit_logs(client, admin_headers):
    response = client.get("/audit-logs/", headers=admin_headers)
    assert response.status_code == 200

def test_manager_no_access_audit_logs(client, manager_headers):
    response = client.get("/audit-logs/", headers=manager_headers)
    assert response.status_code == 403

def test_viewer_no_access_audit_logs(client, user_headers):
    response = client.get("/audit-logs/", headers=user_headers)
    assert response.status_code == 403

def test_admin_access_users(client, admin_headers):
    response = client.get("/users/", headers=admin_headers)
    assert response.status_code == 200

def test_manager_no_access_users(client, manager_headers):
    response = client.get("/users/", headers=manager_headers)
    assert response.status_code == 403

# Advanced Scenario: Manager updating quantity
def test_manager_update_quantity(client, admin_headers, manager_headers):
    # 1. Admin creates item
    res = client.post(
        "/items/",
        json={"title": "Item A", "description": "Desc", "price": 50, "quantity": 5},
        headers=admin_headers
    )
    assert res.status_code == 200
    item_id = res.json()["id"]

    # 2. Manager updates quantity
    res = client.patch(
        f"/items/{item_id}/quantity",
        json={"quantity": 20},
        headers=manager_headers
    )
    assert res.status_code == 200
    assert res.json()["quantity"] == 20

def test_viewer_update_quantity_forbidden(client, admin_headers, user_headers):
    # 1. Admin creates item
    res = client.post(
        "/items/",
        json={"title": "Item B", "description": "Desc", "price": 50, "quantity": 5},
        headers=admin_headers
    )
    assert res.status_code == 200
    item_id = res.json()["id"]

    # 2. Viewer tries to update quantity
    res = client.patch(
        f"/items/{item_id}/quantity",
        json={"quantity": 20},
        headers=user_headers
    )
    assert res.status_code == 403
