import asyncio

from sqlalchemy import select, text

from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models import AstroShot, CelestialObject, User

OBJECTS = [
    {"id": 10, "slug": "deep-sky", "name": "Deep Sky", "type": "category", "parent_id": None, "sort_order": 0, "texture_path": "/textures/8k_stars_milky_way.jpg"},
    {"id": 0, "slug": "sun", "name": "Солнце", "type": "star", "parent_id": None, "sort_order": 1, "texture_path": "/textures/2k_sun.jpg"},
    {"id": 1, "slug": "mercury", "name": "Меркурий", "type": "planet", "parent_id": None, "sort_order": 2, "texture_path": "/textures/2k_mercury.jpg"},
    {"id": 2, "slug": "venus", "name": "Венера", "type": "planet", "parent_id": None, "sort_order": 3, "texture_path": "/textures/2k_venus_atmosphere.jpg"},
    {"id": 3, "slug": "earth", "name": "Земля", "type": "planet", "parent_id": None, "sort_order": 4, "texture_path": "/textures/2k_earth_daymap.jpg"},
    {"id": 9, "slug": "moon", "name": "Луна", "type": "satellite", "parent_id": 3, "sort_order": 5, "texture_path": "/textures/2k_moon.jpg"},
    {"id": 4, "slug": "mars", "name": "Марс", "type": "planet", "parent_id": None, "sort_order": 6, "texture_path": "/textures/2k_mars.jpg"},
    {"id": 5, "slug": "jupiter", "name": "Юпитер", "type": "planet", "parent_id": None, "sort_order": 7, "texture_path": "/textures/2k_jupiter.jpg"},
    {"id": 6, "slug": "saturn", "name": "Сатурн", "type": "planet", "parent_id": None, "sort_order": 8, "texture_path": "/textures/2k_saturn.jpg"},
    {"id": 7, "slug": "uranus", "name": "Уран", "type": "planet", "parent_id": None, "sort_order": 9, "texture_path": "/textures/2k_uranus.jpg"},
    {"id": 8, "slug": "neptune", "name": "Нептун", "type": "planet", "parent_id": None, "sort_order": 10, "texture_path": "/textures/2k_neptune.jpg"},
]

SHOTS = [
    {"id": 1, "title": "Активные солнечные пятна", "author_name": "Алина К.", "object_id": 0, "image_url": "/textures/2k_sun.jpg", "base_likes_count": 214, "telescope": "Sky-Watcher 200PDS", "camera": "ZWO ASI585MC", "coordinates": "RA 02h 31m, Dec +12d 24m", "location": "Сочи, Россия", "description": "Стекинг 1200 кадров через солнечный фильтр, усилен локальный контраст."},
    {"id": 2, "title": "Фаза Венеры на закате", "author_name": "Никита Р.", "object_id": 2, "image_url": "/textures/2k_venus_atmosphere.jpg", "base_likes_count": 167, "telescope": "Celestron C8", "camera": "Canon EOS 90D", "coordinates": "RA 04h 18m, Dec +21d 05m", "location": "Казань, Россия", "description": "Снимок сделан в просвет облачности, серия из 70 кадров."},
    {"id": 3, "title": "Марс в противостоянии", "author_name": "Влад С.", "object_id": 4, "image_url": "/textures/2k_mars.jpg", "base_likes_count": 302, "telescope": "Meade LX90 8\"", "camera": "ASI462MC", "coordinates": "RA 07h 41m, Dec +24d 19m", "location": "Новосибирск, Россия", "description": "Собраны серии по RGB-каналам, итоговый кадр с мягкой шарпининговой обработкой."},
    {"id": 4, "title": "Полосы Юпитера крупным планом", "author_name": "Игорь Л.", "object_id": 5, "image_url": "/textures/2k_jupiter.jpg", "base_likes_count": 426, "telescope": "Dobsonian 300/1500", "camera": "Player One Neptune-C II", "coordinates": "RA 11h 03m, Dec -03d 52m", "location": "Алматы, Казахстан", "description": "Видны детали Большого Красного Пятна и турбулентность в экваториальных поясах."},
    {"id": 5, "title": "Кольца Сатурна", "author_name": "Елена Т.", "object_id": 6, "image_url": "/textures/2k_saturn.jpg", "base_likes_count": 358, "telescope": "Sky-Watcher 250P", "camera": "Nikon Z6 II", "coordinates": "RA 14h 22m, Dec -09d 11m", "location": "Баку, Азербайджан", "description": "Кадр получен при хорошем сиинге, отчетливо видна щель Кассини."},
    {"id": 6, "title": "Голубой диск Нептуна", "author_name": "Саша М.", "object_id": 8, "image_url": "/textures/2k_neptune.jpg", "base_likes_count": 141, "telescope": "Maksutov 180", "camera": "ASI678MC", "coordinates": "RA 22h 47m, Dec -10d 02m", "location": "Тбилиси, Грузия", "description": "Слабоконтрастная обработка, чтобы сохранить естественный оттенок планеты."},
    {"id": 7, "title": "Уран в холодных тонах", "author_name": "Денис П.", "object_id": 7, "image_url": "/textures/2k_uranus.jpg", "base_likes_count": 120, "telescope": "Celestron EdgeHD 9.25", "camera": "QHY5III715C", "coordinates": "RA 03h 09m, Dec +17d 43m", "location": "Ереван, Армения", "description": "Финальный кадр собран из 12 видеофрагментов по 90 секунд."},
    {"id": 8, "title": "Текстуры Меркурия", "author_name": "Марина Ф.", "object_id": 1, "image_url": "/textures/2k_mercury.jpg", "base_likes_count": 95, "telescope": "Explore Scientific 127ED", "camera": "Sony A7 III", "coordinates": "RA 00h 41m, Dec -05d 33m", "location": "Калининград, Россия", "description": "Показаны тонкие переходы рельефа после аккуратной деконволюции."},
    {"id": 9, "title": "Облачные фронты Земли", "author_name": "Олег Н.", "object_id": 3, "image_url": "/textures/2k_earth_daymap.jpg", "base_likes_count": 289, "telescope": "Samyang 135mm", "camera": "Canon EOS R6", "coordinates": "RA 18h 11m, Dec +06d 04m", "location": "Владивосток, Россия", "description": "Серия кадров через узкую облачную щель, объединено в единый кадр."},
    {"id": 10, "title": "Глубокое небо Млечного Пути", "author_name": "Анна В.", "object_id": 10, "image_url": "/textures/8k_stars_milky_way.jpg", "base_likes_count": 511, "telescope": "RedCat 51", "camera": "ASI2600MC Pro", "coordinates": "RA 17h 45m, Dec -29d 00m", "location": "Чолпон-Ата, Кыргызстан", "description": "Общая экспозиция 4 часа, калибровка по dark/bias/flat и мягкое шумоподавление."},
    {"id": 11, "title": "Лунные кратеры на терминаторе", "author_name": "Роман Г.", "object_id": 9, "image_url": "/textures/2k_moon.jpg", "base_likes_count": 274, "telescope": "Orion XT8", "camera": "ASI224MC", "coordinates": "RA 08h 52m, Dec +19d 14m", "location": "Минск, Беларусь", "description": "Подчеркнуты тени по линии терминатора для лучшей читаемости рельефа."},
]


async def upsert_seed_data() -> None:
    async with AsyncSessionLocal() as session:
        for object_data in OBJECTS:
            existing_object = await session.get(CelestialObject, object_data["id"])
            if existing_object is None:
                session.add(CelestialObject(**object_data))
            else:
                for key, value in object_data.items():
                    setattr(existing_object, key, value)

        demo_user = await session.scalar(select(User).where(User.email == "demo@astrobase.local"))
        if demo_user is None:
            session.add(
                User(
                    email="demo@astrobase.local",
                    username="demo",
                    display_name="Demo Astro",
                    password_hash=get_password_hash("astro-demo-password"),
                    role="member",
                    reputation=840,
                )
            )

        admin_user = await session.scalar(select(User).where(User.email == "admin@astrobase.local"))
        if admin_user is None:
            session.add(
                User(
                    email="admin@astrobase.local",
                    username="admin",
                    display_name="Astro Admin",
                    password_hash=get_password_hash("astro-admin-password"),
                    role="admin",
                    reputation=1000,
                )
            )
        elif admin_user.role != "admin":
            admin_user.role = "admin"

        for shot_data in SHOTS:
            existing_shot = await session.get(AstroShot, shot_data["id"])
            if existing_shot is None:
                session.add(AstroShot(**shot_data))
            else:
                for key, value in shot_data.items():
                    setattr(existing_shot, key, value)

        await session.flush()
        await session.execute(
            text(
                """
                SELECT setval(
                    pg_get_serial_sequence('astro_shots', 'id'),
                    COALESCE((SELECT MAX(id) FROM astro_shots), 1),
                    true
                )
                """
            )
        )

        await session.commit()


if __name__ == "__main__":
    asyncio.run(upsert_seed_data())
