"""Diagram management routes."""
from flask import Blueprint, request, jsonify
from auth import require_auth, log_audit
from database import db

diagram_bp = Blueprint('diagrams', __name__, url_prefix='/api/diagrams')


@diagram_bp.route('', methods=['GET'])
@require_auth
def get_diagrams():
    """Get all diagrams for the authenticated user."""
    try:
        user_id = request.user_id

        query = """
            SELECT id, title, code, thumbnail, created_at, updated_at
            FROM t_diagrams
            WHERE user_id = %s AND is_deleted = FALSE
            ORDER BY updated_at DESC
        """
        diagrams = db.execute_query(query, (user_id,), fetch_all=True)

        # Convert timestamps to ISO format
        result = []
        for diagram in diagrams:
            result.append({
                'id': diagram['id'],
                'title': diagram['title'],
                'code': diagram['code'],
                'thumbnail': diagram['thumbnail'],
                'created_at': diagram['created_at'].isoformat() if diagram['created_at'] else None,
                'updated_at': diagram['updated_at'].isoformat() if diagram['updated_at'] else None
            })

        return jsonify({'diagrams': result}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@diagram_bp.route('/<int:diagram_id>', methods=['GET'])
@require_auth
def get_diagram(diagram_id):
    """Get a specific diagram."""
    try:
        user_id = request.user_id

        query = """
            SELECT id, title, code, thumbnail, created_at, updated_at
            FROM t_diagrams
            WHERE id = %s AND user_id = %s AND is_deleted = FALSE
        """
        diagram = db.execute_query(query, (diagram_id, user_id), fetch_one=True)

        if not diagram:
            return jsonify({'error': 'Diagram not found'}), 404

        return jsonify({
            'diagram': {
                'id': diagram['id'],
                'title': diagram['title'],
                'code': diagram['code'],
                'thumbnail': diagram['thumbnail'],
                'created_at': diagram['created_at'].isoformat() if diagram['created_at'] else None,
                'updated_at': diagram['updated_at'].isoformat() if diagram['updated_at'] else None
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@diagram_bp.route('', methods=['POST'])
@require_auth
def create_diagram():
    """Create a new diagram."""
    try:
        user_id = request.user_id
        data = request.get_json()

        title = data.get('title', '').strip()
        code = data.get('code', '').strip()
        thumbnail = data.get('thumbnail')

        if not title:
            return jsonify({'error': 'Title is required'}), 400

        if not code:
            return jsonify({'error': 'Code is required'}), 400

        query = """
            INSERT INTO t_diagrams (user_id, title, code, thumbnail)
            VALUES (%s, %s, %s, %s)
            RETURNING id, title, code, thumbnail, created_at, updated_at
        """
        diagram = db.execute_query(query, (user_id, title, code, thumbnail), fetch_one=True)

        # Log audit event
        log_audit('create_diagram', 'diagram', diagram['id'])

        return jsonify({
            'diagram': {
                'id': diagram['id'],
                'title': diagram['title'],
                'code': diagram['code'],
                'thumbnail': diagram['thumbnail'],
                'created_at': diagram['created_at'].isoformat() if diagram['created_at'] else None,
                'updated_at': diagram['updated_at'].isoformat() if diagram['updated_at'] else None
            }
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@diagram_bp.route('/<int:diagram_id>', methods=['PUT'])
@require_auth
def update_diagram(diagram_id):
    """Update an existing diagram."""
    try:
        user_id = request.user_id
        data = request.get_json()

        # Check if diagram exists and belongs to user
        check_query = """
            SELECT id FROM t_diagrams
            WHERE id = %s AND user_id = %s AND is_deleted = FALSE
        """
        existing = db.execute_query(check_query, (diagram_id, user_id), fetch_one=True)

        if not existing:
            return jsonify({'error': 'Diagram not found'}), 404

        # Build update query dynamically based on provided fields
        update_fields = []
        params = []

        if 'title' in data:
            update_fields.append('title = %s')
            params.append(data['title'].strip())

        if 'code' in data:
            update_fields.append('code = %s')
            params.append(data['code'].strip())

        if 'thumbnail' in data:
            update_fields.append('thumbnail = %s')
            params.append(data['thumbnail'])

        if not update_fields:
            return jsonify({'error': 'No fields to update'}), 400

        update_fields.append('updated_at = CURRENT_TIMESTAMP')

        params.append(diagram_id)
        params.append(user_id)

        query = f"""
            UPDATE t_diagrams
            SET {', '.join(update_fields)}
            WHERE id = %s AND user_id = %s
            RETURNING id, title, code, thumbnail, created_at, updated_at
        """
        diagram = db.execute_query(query, tuple(params), fetch_one=True)

        # Log audit event
        log_audit('update_diagram', 'diagram', diagram_id)

        return jsonify({
            'diagram': {
                'id': diagram['id'],
                'title': diagram['title'],
                'code': diagram['code'],
                'thumbnail': diagram['thumbnail'],
                'created_at': diagram['created_at'].isoformat() if diagram['created_at'] else None,
                'updated_at': diagram['updated_at'].isoformat() if diagram['updated_at'] else None
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@diagram_bp.route('/<int:diagram_id>', methods=['DELETE'])
@require_auth
def delete_diagram(diagram_id):
    """Soft delete a diagram."""
    try:
        user_id = request.user_id

        # Check if diagram exists and belongs to user
        check_query = """
            SELECT id FROM t_diagrams
            WHERE id = %s AND user_id = %s AND is_deleted = FALSE
        """
        existing = db.execute_query(check_query, (diagram_id, user_id), fetch_one=True)

        if not existing:
            return jsonify({'error': 'Diagram not found'}), 404

        # Soft delete
        query = """
            UPDATE t_diagrams
            SET is_deleted = TRUE
               ,updated_at = CURRENT_TIMESTAMP
            WHERE id = %s AND user_id = %s
        """
        db.execute_query(query, (diagram_id, user_id))

        # Log audit event
        log_audit('delete_diagram', 'diagram', diagram_id)

        return jsonify({'message': 'Diagram deleted successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@diagram_bp.route('/<int:diagram_id>/restore', methods=['POST'])
@require_auth
def restore_diagram(diagram_id):
    """Restore a soft-deleted diagram."""
    try:
        user_id = request.user_id

        # Check if diagram exists and belongs to user
        check_query = """
            SELECT id FROM t_diagrams
            WHERE id = %s AND user_id = %s AND is_deleted = TRUE
        """
        existing = db.execute_query(check_query, (diagram_id, user_id), fetch_one=True)

        if not existing:
            return jsonify({'error': 'Deleted diagram not found'}), 404

        # Restore
        query = """
            UPDATE t_diagrams
            SET is_deleted = FALSE
               ,updated_at = CURRENT_TIMESTAMP
            WHERE id = %s AND user_id = %s
        """
        db.execute_query(query, (diagram_id, user_id))

        # Log audit event
        log_audit('restore_diagram', 'diagram', diagram_id)

        return jsonify({'message': 'Diagram restored successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
