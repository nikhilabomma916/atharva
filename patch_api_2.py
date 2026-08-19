import os

def patch_file(filepath, replacements):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r') as f:
        content = f.read()
    for old, new in replacements:
        content = content.replace(old, new)
    with open(filepath, 'w') as f:
        f.write(content)

patch_file("/Users/arundathiasalla/Documents/MONTH-1/fermentation-chamber/atharva/app/api/grievances/[id]/resolve/route.ts", [
    ("visibility: 'public',", "isPublic: true,")
])

patch_file("/Users/arundathiasalla/Documents/MONTH-1/fermentation-chamber/atharva/app/api/grievances/route.ts", [
    ("entityId: id,\n    actorId: user.userId,\n    actorName: user.name,\n    actorRole: user.role as any,\n    action: 'CREATE',\n    actorId: user.userId,\n    details: 'Grievance submitted',", "entityId: id,\n    actorId: user.userId,\n    actorName: user.name,\n    actorRole: user.role as any,\n    action: 'CREATE',")
])
