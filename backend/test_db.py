# backend/test_db.py
"""
Скрипт проверки подключения к базе данных e_additives.
"""
import asyncio
from sqlalchemy import text
from app.db.database import AsyncSessionLocal

async def test_connection():
    """Проверка подключения к базе данных и структуры таблицы e_additives"""
    
    print("=" * 60)
    print("ПРОВЕРКА ПОДКЛЮЧЕНИЯ К БАЗЕ ДАННЫХ")
    print("=" * 60)
    
    try:
        async with AsyncSessionLocal() as session:
            # Проверка базового подключения
            result = await session.execute(text("SELECT 1"))
            print("✓ Подключение к базе данных успешно установлено")
            
            # Проверка наличия таблицы e_additives
            result = await session.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'e_additives'
                )
            """))
            table_exists = result.fetchone()[0]
            
            if table_exists:
                print("✓ Таблица 'e_additives' найдена")
            else:
                print("✗ Таблица 'e_additives' НЕ найдена!")
                print("\nДоступные таблицы в базе данных:")
                
                # Показываем все таблицы
                result = await session.execute(text("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public'
                    ORDER BY table_name
                """))
                tables = result.fetchall()
                for t in tables:
                    print(f"  - {t[0]}")
                return
            
            # Подсчет записей
            result = await session.execute(text("SELECT COUNT(*) FROM e_additives"))
            count = result.fetchone()[0]
            print(f"✓ Количество записей: {count}")
            
            if count == 0:
                print("  ВНИМАНИЕ: Таблица пуста, нет данных для анализа")
            
            # Информация о структуре таблицы
            print("\n" + "=" * 60)
            print("СТРУКТУРА ТАБЛИЦЫ 'e_additives'")
            print("=" * 60)
            
            result = await session.execute(text("""
                SELECT 
                    column_name,
                    data_type,
                    is_nullable
                FROM information_schema.columns
                WHERE table_name = 'e_additives'
                ORDER BY ordinal_position
            """))
            
            columns = result.fetchall()
            for col in columns:
                nullable = "NULL" if col[2] == "YES" else "NOT NULL"
                print(f"  {col[0]:20} {col[1]:20} {nullable}")
            
            # Примеры записей
            print("\n" + "=" * 60)
            print("ПРИМЕРЫ ЗАПИСЕЙ (первые 5)")
            print("=" * 60)
            
            result = await session.execute(text("""
                SELECT e_code, name_ru, category, danger_level
                FROM e_additives
                LIMIT 5
            """))
            
            rows = result.fetchall()
            
            if rows:
                for row in rows:
                    print(f"\n  E-код:      {row[0]}")
                    print(f"  Название:   {row[1]}")
                    print(f"  Категория:  {row[2]}")
                    print(f"  Опасность:  {row[3]}")
            else:
                print("  Нет записей для отображения")
            
            # Распределение по уровню опасности
            print("\n" + "=" * 60)
            print("РАСПРЕДЕЛЕНИЕ ПО УРОВНЮ ОПАСНОСТИ")
            print("=" * 60)
            
            result = await session.execute(text("""
                SELECT danger_level, COUNT(*) as cnt
                FROM e_additives
                GROUP BY danger_level
                ORDER BY cnt DESC
            """))
            
            danger_stats = result.fetchall()
            if danger_stats:
                for stat in danger_stats:
                    print(f"  {stat[0]:20} : {stat[1]} записей")
            
            # Категории
            print("\n" + "=" * 60)
            print("КАТЕГОРИИ ДОБАВОК")
            print("=" * 60)
            
            result = await session.execute(text("""
                SELECT category, COUNT(*) as cnt
                FROM e_additives
                GROUP BY category
                ORDER BY cnt DESC
            """))
            
            cat_stats = result.fetchall()
            if cat_stats:
                for stat in cat_stats:
                    print(f"  {stat[0]:30} : {stat[1]} записей")
            
            print("\n" + "=" * 60)
            print("ПРОВЕРКА ЗАВЕРШЕНА УСПЕШНО")
            print("=" * 60)
            
    except Exception as e:
        print("\n" + "=" * 60)
        print("ОШИБКА ПОДКЛЮЧЕНИЯ")
        print("=" * 60)
        print(f"\n  {type(e).__name__}: {e}")
        print("\nВозможные причины:")
        print("  1. PostgreSQL не запущен")
        print("  2. Неправильные параметры в .env файле")
        print("  3. База данных не существует")
        print("  4. Неправильный пароль пользователя")
        print("  5. Брандмауэр блокирует порт")
        print("\nПроверьте файл .env:")
        print("  DB_HOST=localhost")
        print("  DB_PORT=5433")
        print("  DB_NAME=additives")
        print("  DB_USER=additives")
        print("  DB_PASSWORD=123")


async def test_specific_query():
    """Тестовый поиск добавок"""
    print("\n" + "=" * 60)
    print("ТЕСТОВЫЙ ПОИСК ДОБАВОК")
    print("=" * 60)
    
    test_codes = ['E100', 'E200', 'E300', 'E999']
    
    try:
        async with AsyncSessionLocal() as session:
            for code in test_codes:
                result = await session.execute(
                    text("SELECT e_code, name_ru, danger_level FROM e_additives WHERE e_code = :code"),
                    {"code": code}
                )
                row = result.fetchone()
                
                if row:
                    print(f"  {row[0]} - {row[1]} ({row[2]})")
                else:
                    print(f"  {code} - не найден в базе")
                    
    except Exception as e:
        print(f"  Ошибка: {e}")


if __name__ == "__main__":
    asyncio.run(test_connection())
    asyncio.run(test_specific_query())
    
    print("\nДля запуска сервера выполните:")
    print("  uvicorn app.main:app --reload")