from app.db import models
from app.core import security
import time

def test_items_sorted_by_last_updated(client, admin_headers):
    # 1. Create Item A
    response = client.post(
        "/items/",
        json={"title": "Item A", "description": "First item", "price": 10, "quantity": 5},
        headers=admin_headers
    )
    assert response.status_code == 200
    item_a_id = response.json()["id"]
    
    # 2. Sleep briefly to ensure timestamp difference
    time.sleep(1.1) 

    # 3. Create Item B
    response = client.post(
        "/items/",
        json={"title": "Item B", "description": "Second item", "price": 20, "quantity": 10},
        headers=admin_headers
    )
    assert response.status_code == 200
    item_b_id = response.json()["id"]

    # Verify initial order: B (newest), A (oldest)
    response = client.get("/items/", headers=admin_headers)
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) >= 2
    # Check specifically our items in the result list (filtering by IDs we just created)
    our_items = [i for i in items if i["id"] in [item_a_id, item_b_id]]
    # Since we sort by last_updated desc, and B was created later, B should be first
    assert our_items[0]["id"] == item_b_id
    assert our_items[1]["id"] == item_a_id

    # 4. Sleep briefly
    time.sleep(1.1)

    # 5. Update Item A
    response = client.put(
        f"/items/{item_a_id}",
        json={"description": "Updated First Item"},
        headers=admin_headers
    )
    assert response.status_code == 200
    
    # 6. Verify new order: A (updated newest), B (older)
    response = client.get("/items/", headers=admin_headers)
    assert response.status_code == 200
    items = response.json()["items"]
    our_items = [i for i in items if i["id"] in [item_a_id, item_b_id]]
    
    assert our_items[0]["id"] == item_a_id
    assert our_items[1]["id"] == item_b_id
