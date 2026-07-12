{
    'name': 'AssetFlow Enterprise Asset & Resource Management',
    'version': '1.0',
    'summary': 'Asset Tracking, Resource Bookings, Maintenance Kanban, and Audits',
    'description': """
        AssetFlow simplifies and digitizes how organizations track, allocate, and maintain their physical assets and shared resources.
    """,
    'category': 'Operations',
    'depends': ['base', 'hr', 'mail', 'calendar'],
    'data': [
        'security/security_groups.xml',
        'security/ir.model.access.csv',
        'security/security_rules.xml',
        'data/sequence_data.xml',
        'views/asset_views.xml',
        'views/allocation_views.xml',
        'views/booking_views.xml',
        'views/maintenance_views.xml',
        'views/audit_views.xml',
        'views/menu_views.xml',
    ],
    'installable': True,
    'application': True,
    'auto_install': False,
    'license': 'LGPL-3',
}
