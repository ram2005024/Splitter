from fastapi import APIRouter
from app.modules.activities.router import router as activities_router
from app.modules.auth.router import router as auth_router
from app.modules.expenses.router import router as expenses_router
from app.modules.groups.router import router as groups_router
from app.modules.settlements.router import router as settlements_router
from app.modules.users.router import router as users_router

api_v1_router = APIRouter()

api_v1_router.include_router(auth_router)
api_v1_router.include_router(users_router)
api_v1_router.include_router(groups_router)
api_v1_router.include_router(expenses_router)
api_v1_router.include_router(settlements_router)
api_v1_router.include_router(activities_router)
