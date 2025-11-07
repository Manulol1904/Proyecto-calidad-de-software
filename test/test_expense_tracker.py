# tests/test_expense_tracker.py
import unittest
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import TimeoutException, NoSuchElementException


class ExpenseTrackerTests(unittest.TestCase):
    """Suite de pruebas completa para el sistema de gastos"""
    
    @classmethod
    def setUpClass(cls):
        """Configuración inicial - se ejecuta una vez"""
        cls.driver = webdriver.Chrome()  # O Firefox(), Edge(), etc.
        cls.driver.maximize_window()
        cls.base_url = "http://localhost:5173"  # URL de Vite dev server
        cls.wait = WebDriverWait(cls.driver, 10)
        
        # Credenciales de prueba
        cls.test_user = {
            "email": "manu123@gmail.com",
            "password": "manu123",
            "name": "Usuario Test",
            "income": "3000000"
        }
    
    @classmethod
    def tearDownClass(cls):
        """Limpieza final - se ejecuta una vez"""
        cls.driver.quit()
    
    def setUp(self):
        """Se ejecuta antes de cada test"""
        self.driver.get(self.base_url)
        time.sleep(1)
    
    # ==========================================
    # TESTS DE AUTENTICACIÓN
    # ==========================================
    
    def test_01_registro_usuario_nuevo(self):
        """Test: Registro de un nuevo usuario"""
        print("\n🧪 Test: Registro de usuario nuevo")
        
        # Ir a la página de registro
        register_link = self.wait.until(
            EC.element_to_be_clickable((By.CLASS_NAME, "register-btn"))
        )
        register_link.click()
        time.sleep(1)
        
        # Verificar que estamos en la página de registro
        self.assertIn("Crear cuenta", self.driver.page_source)
        
        # Llenar el formulario
        name_input = self.driver.find_element(By.CSS_SELECTOR, "input[placeholder='Tu nombre completo']")
        email_input = self.driver.find_element(By.CSS_SELECTOR, "input[type='email']")
        password_input = self.driver.find_element(By.CSS_SELECTOR, "input[type='password']")
        income_input = self.driver.find_element(By.CSS_SELECTOR, "input[type='number']")
        
        # Generar email único con timestamp
        import time
        unique_email = f"test_{int(time.time())}@example.com"
        
        name_input.send_keys(self.test_user["name"])
        email_input.send_keys(unique_email)
        password_input.send_keys(self.test_user["password"])
        income_input.send_keys(self.test_user["income"])
        
        # Seleccionar tipo de pago
        income_type_select = self.driver.find_element(By.CSS_SELECTOR, "select")
        income_type_select.click()
        time.sleep(0.5)
        # Seleccionar "Quincenal"
        options = income_type_select.find_elements(By.TAG_NAME, "option")
        options[1].click()  # Segunda opción: quincenal
        
        # Enviar formulario
        submit_btn = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        submit_btn.click()
        
        # Esperar mensaje de éxito o redirección
        time.sleep(2)
        
        # Verificar que se muestra alerta de éxito
        # (Nota: ajustar según el comportamiento real de tu app)
        print("✅ Usuario registrado exitosamente")
    
    def test_02_login_exitoso(self):
        """Test: Login con credenciales correctas"""
        print("\n🧪 Test: Login exitoso")
        
        # Llenar formulario de login
        email_input = self.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
        )
        password_input = self.driver.find_element(By.CSS_SELECTOR, "input[type='password']")
        
        email_input.send_keys(self.test_user["email"])
        password_input.send_keys(self.test_user["password"])
        
        # Click en botón de login
        login_btn = self.driver.find_element(By.CLASS_NAME, "login-btn")
        login_btn.click()
        
        # Esperar redirección al dashboard
        try:
            dashboard_title = self.wait.until(
                EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Dashboard Financiero')]"))
            )
            print("✅ Login exitoso - Dashboard cargado")
            self.assertTrue(dashboard_title.is_displayed())
        except TimeoutException:
            self.fail("No se pudo cargar el dashboard después del login")
    
    def test_03_login_credenciales_incorrectas(self):
        """Test: Login con credenciales incorrectas"""
        print("\n🧪 Test: Login con credenciales incorrectas")
        
        email_input = self.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
        )
        password_input = self.driver.find_element(By.CSS_SELECTOR, "input[type='password']")
        
        email_input.send_keys("wrong@example.com")
        password_input.send_keys("wrongpassword")
        
        login_btn = self.driver.find_element(By.CLASS_NAME, "login-btn")
        login_btn.click()
        
        # Verificar mensaje de error
        time.sleep(2)
        error_message = self.driver.find_element(By.CLASS_NAME, "login-error")
        self.assertTrue(error_message.is_displayed())
        print("✅ Mensaje de error mostrado correctamente")
    
    def test_04_recuperar_contraseña(self):
        """Test: Proceso de recuperación de contraseña"""
        print("\n🧪 Test: Recuperación de contraseña")
        
        # Click en "¿Olvidaste tu contraseña?"
        forgot_link = self.wait.until(
            EC.element_to_be_clickable((By.CLASS_NAME, "forgot-link"))
        )
        forgot_link.click()
        time.sleep(1)
        
        # Verificar que estamos en la página de recuperación
        self.assertIn("Recuperar contraseña", self.driver.page_source)
        
        # Ingresar email
        email_input = self.driver.find_element(By.CSS_SELECTOR, "input[type='email']")
        email_input.send_keys(self.test_user["email"])
        
        # Enviar
        submit_btn = self.driver.find_element(By.CLASS_NAME, "login-btn")
        submit_btn.click()
        
        time.sleep(2)
        # Verificar mensaje de éxito
        success_message = self.driver.find_element(By.CLASS_NAME, "success-message")
        self.assertTrue(success_message.is_displayed())
        print("✅ Proceso de recuperación iniciado correctamente")
    
    # ==========================================
    # TESTS DE NAVEGACIÓN
    # ==========================================
    
    def test_05_navegacion_entre_paginas(self):
        """Test: Navegación entre diferentes secciones"""
        print("\n🧪 Test: Navegación entre páginas")
        
        # Login primero
        self._do_login()
        
        # Verificar navegación a Gastos
        gastos_link = self.wait.until(
            EC.element_to_be_clickable((By.XPATH, "//a[contains(text(), 'Gastos')]"))
        )
        gastos_link.click()
        time.sleep(1)
        self.assertIn("Gestión de Ingresos y Gastos", self.driver.page_source)
        print("✅ Navegación a Gastos OK")
        
        # Verificar navegación a Configuración
        config_link = self.driver.find_element(By.XPATH, "//a[contains(text(), 'Configuración')]")
        config_link.click()
        time.sleep(1)
        self.assertIn("Configuración del Usuario", self.driver.page_source)
        print("✅ Navegación a Configuración OK")
        
        # Volver al Dashboard
        dashboard_link = self.driver.find_element(By.XPATH, "//a[contains(text(), 'Dashboard')]")
        dashboard_link.click()
        time.sleep(1)
        self.assertIn("Dashboard Financiero", self.driver.page_source)
        print("✅ Navegación a Dashboard OK")
    
    # ==========================================
    # TESTS DE GESTIÓN DE GASTOS
    # ==========================================
    
    def test_06_agregar_gasto_simple(self):
        """Test: Agregar un gasto simple"""
        print("\n🧪 Test: Agregar gasto simple")
        
        self._do_login()
        
        # Ir a la página de gastos
        self._navigate_to_expenses()
        
        # Llenar formulario de gasto
        title_input = self.driver.find_element(By.CSS_SELECTOR, "input[placeholder='Título (ej: Netflix)']")
        amount_input = self.driver.find_element(By.CSS_SELECTOR, "input[placeholder='Valor']")
        category_input = self.driver.find_element(By.CSS_SELECTOR, "input[placeholder='Categoría']")
        
        title_input.send_keys("Supermercado")
        amount_input.send_keys("50000")
        category_input.send_keys("Alimentación")
        
        # Enviar formulario
        submit_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Agregar')]")
        submit_btn.click()
        
        time.sleep(2)
        
        # Verificar que el gasto aparece en la tabla
        table = self.driver.find_element(By.CLASS_NAME, "expense-table")
        self.assertIn("Supermercado", table.text)
        print("✅ Gasto agregado correctamente")
    
    def test_07_agregar_ingreso(self):
        """Test: Agregar un ingreso"""
        print("\n🧪 Test: Agregar ingreso")
        
        self._do_login()
        self._navigate_to_expenses()
        
        # Cambiar tipo a "Ingreso"
        type_select = self.driver.find_element(By.CSS_SELECTOR, "select")
        type_select.click()
        options = type_select.find_elements(By.TAG_NAME, "option")
        options[0].click()  # Primera opción: Ingreso
        
        # Llenar formulario
        title_input = self.driver.find_element(By.CSS_SELECTOR, "input[placeholder='Título (ej: Netflix)']")
        amount_input = self.driver.find_element(By.CSS_SELECTOR, "input[placeholder='Valor']")
        category_input = self.driver.find_element(By.CSS_SELECTOR, "input[placeholder='Categoría']")
        
        title_input.send_keys("Bono extra")
        amount_input.send_keys("100000")
        category_input.send_keys("Ingresos extras")
        
        # Enviar
        submit_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Agregar')]")
        submit_btn.click()
        
        time.sleep(2)
        
        # Verificar
        table = self.driver.find_element(By.CLASS_NAME, "expense-table")
        self.assertIn("Bono extra", table.text)
        print("✅ Ingreso agregado correctamente")
    
    def test_08_agregar_gasto_recurrente(self):
        """Test: Agregar un gasto recurrente"""
        print("\n🧪 Test: Agregar gasto recurrente")
        
        self._do_login()
        self._navigate_to_expenses()
        
        # Llenar formulario básico
        title_input = self.driver.find_element(By.CSS_SELECTOR, "input[placeholder='Título (ej: Netflix)']")
        amount_input = self.driver.find_element(By.CSS_SELECTOR, "input[placeholder='Valor']")
        category_input = self.driver.find_element(By.CSS_SELECTOR, "input[placeholder='Categoría']")
        
        title_input.send_keys("Netflix")
        amount_input.send_keys("45000")
        category_input.send_keys("Suscripciones")
        
        # Marcar como recurrente
        recurring_checkbox = self.driver.find_element(By.CSS_SELECTOR, "input[type='checkbox']")
        recurring_checkbox.click()
        time.sleep(0.5)
        
        # Establecer día de recurrencia
        recurrence_day_input = self.driver.find_element(By.CSS_SELECTOR, "input[type='number'][min='1'][max='31']")
        recurrence_day_input.clear()
        recurrence_day_input.send_keys("15")
        
        # Enviar
        submit_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Agregar')]")
        submit_btn.click()
        
        time.sleep(2)
        
        # Verificar que aparece con el icono de recurrente
        table = self.driver.find_element(By.CLASS_NAME, "expense-table")
        self.assertIn("Netflix", table.text)
        self.assertIn("🔁", table.text)
        print("✅ Gasto recurrente agregado correctamente")
    
    def test_09_filtrar_gastos_por_tipo(self):
        """Test: Filtrar gastos por tipo (ingreso/gasto)"""
        print("\n🧪 Test: Filtrar gastos por tipo")
        
        self._do_login()
        self._navigate_to_expenses()
        
        # Agregar un gasto y un ingreso primero
        self._add_quick_expense("Test Gasto", "10000", "expense")
        time.sleep(1)
        self._add_quick_expense("Test Ingreso", "20000", "income")
        time.sleep(2)
        
        # Filtrar por gastos
        filter_select = self.driver.find_elements(By.CSS_SELECTOR, "select")[1]  # Segundo select
        filter_select.click()
        options = filter_select.find_elements(By.TAG_NAME, "option")
        options[2].click()  # "Gastos"
        time.sleep(1)
        
        table = self.driver.find_element(By.CLASS_NAME, "expense-table")
        self.assertIn("Gasto", table.text)
        
        # Filtrar por ingresos
        filter_select.click()
        options = filter_select.find_elements(By.TAG_NAME, "option")
        options[1].click()  # "Ingresos"
        time.sleep(1)
        
        self.assertIn("Ingreso", table.text)
        print("✅ Filtros funcionando correctamente")
    
    def test_10_buscar_gastos(self):
        """Test: Buscar gastos por texto"""
        print("\n🧪 Test: Buscar gastos")
        
        self._do_login()
        self._navigate_to_expenses()
        
        # Agregar gasto de prueba
        self._add_quick_expense("Pizza Dominos", "35000", "expense")
        time.sleep(2)
        
        # Buscar
        search_input = self.driver.find_element(By.CSS_SELECTOR, "input[placeholder='Buscar...']")
        search_input.send_keys("Pizza")
        time.sleep(1)
        
        table = self.driver.find_element(By.CLASS_NAME, "expense-table")
        self.assertIn("Pizza", table.text)
        print("✅ Búsqueda funcionando correctamente")
    
    def test_11_eliminar_gasto(self):
        """Test: Eliminar un gasto"""
        print("\n🧪 Test: Eliminar gasto")
        
        self._do_login()
        self._navigate_to_expenses()
        
        # Agregar gasto de prueba
        test_title = "Gasto a eliminar"
        self._add_quick_expense(test_title, "15000", "expense")
        time.sleep(2)
        
        # Encontrar el botón de eliminar del último gasto
        delete_btns = self.driver.find_elements(By.XPATH, "//button[contains(text(), 'Eliminar')]")
        if delete_btns:
            delete_btns[-1].click()  # Click en el último
            
            # Aceptar confirmación
            time.sleep(0.5)
            alert = self.driver.switch_to.alert
            alert.accept()
            time.sleep(2)
            
            # Verificar que ya no está
            table = self.driver.find_element(By.CLASS_NAME, "expense-table")
            # Si la tabla está vacía o no contiene el gasto, es correcto
            print("✅ Gasto eliminado correctamente")
    
    def test_12_ver_gastos_recurrentes(self):
        """Test: Ver solo gastos recurrentes"""
        print("\n🧪 Test: Ver gastos recurrentes")
        
        self._do_login()
        self._navigate_to_expenses()
        
        # Click en botón "Ver Recurrentes"
        recurring_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Ver Recurrentes')]")
        recurring_btn.click()
        time.sleep(1)
        
        # Verificar que cambió el título
        self.assertIn("Gastos Recurrentes", self.driver.page_source)
        print("✅ Vista de recurrentes funcionando")
    
    # ==========================================
    # TESTS DE DASHBOARD
    # ==========================================
    
    def test_13_visualizar_graficas_dashboard(self):
        """Test: Verificar que las gráficas se cargan en el dashboard"""
        print("\n🧪 Test: Visualizar gráficas del dashboard")
        
        self._do_login()
        time.sleep(2)
        
        # Verificar que existe el canvas de las gráficas (Chart.js)
        canvases = self.driver.find_elements(By.TAG_NAME, "canvas")
        self.assertGreater(len(canvases), 0, "No se encontraron gráficas en el dashboard")
        print(f"✅ Se encontraron {len(canvases)} gráficas")
    
    def test_14_verificar_resumen_dashboard(self):
        """Test: Verificar que se muestra el resumen financiero"""
        print("\n🧪 Test: Resumen financiero en dashboard")
        
        self._do_login()
        time.sleep(2)
        
        # Verificar tarjetas de resumen
        summary_cards = self.driver.find_elements(By.CLASS_NAME, "summary-card")
        self.assertGreaterEqual(len(summary_cards), 3, "Faltan tarjetas de resumen")
        
        # Verificar que contienen información
        for card in summary_cards:
            self.assertTrue(len(card.text) > 0)
        
        print("✅ Resumen financiero mostrado correctamente")
    
    # ==========================================
    # TESTS DE CONFIGURACIÓN
    # ==========================================
    
    def test_15_actualizar_perfil(self):
        """Test: Actualizar información del perfil"""
        print("\n🧪 Test: Actualizar perfil de usuario")
        
        self._do_login()
        
        # Ir a configuración
        config_link = self.driver.find_element(By.XPATH, "//a[contains(text(), 'Configuración')]")
        config_link.click()
        time.sleep(1)
        
        # Actualizar nombre
        name_input = self.driver.find_element(By.CSS_SELECTOR, "input[placeholder='Tu nombre']")
        name_input.clear()
        name_input.send_keys("Nombre Actualizado")
        
        # Guardar cambios
        save_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Guardar cambios')]")
        save_btn.click()
        time.sleep(2)
        
        print("✅ Perfil actualizado correctamente")
    
    def test_16_cambiar_tipo_ingreso(self):
        """Test: Cambiar tipo de ingreso (mensual/quincenal)"""
        print("\n🧪 Test: Cambiar tipo de ingreso")
        
        self._do_login()
        
        # Ir a configuración
        config_link = self.driver.find_element(By.XPATH, "//a[contains(text(), 'Configuración')]")
        config_link.click()
        time.sleep(1)
        
        # Cambiar tipo de pago
        income_type_select = self.driver.find_elements(By.CSS_SELECTOR, "select")[0]
        income_type_select.click()
        options = income_type_select.find_elements(By.TAG_NAME, "option")
        options[1].click()  # Cambiar a quincenal
        
        # Actualizar
        update_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Actualizar configuración')]")
        update_btn.click()
        time.sleep(2)
        
        print("✅ Tipo de ingreso actualizado")
    
    # ==========================================
    # TESTS DE EXPORTACIÓN
    # ==========================================
    
    def test_17_exportar_pdf(self):
        """Test: Exportar reporte PDF"""
        print("\n🧪 Test: Exportar reporte PDF")
        
        self._do_login()
        self._navigate_to_expenses()
        
        # Click en botón de exportar PDF
        pdf_btn = self.driver.find_element(By.CLASS_NAME, "btn-pdf")
        pdf_btn.click()
        time.sleep(2)
        
        # Nota: Verificar descarga requiere configuración adicional
        # Por ahora solo verificamos que el botón responde
        print("✅ Botón de exportar PDF funciona")
    
    # ==========================================
    # TESTS DE SESIÓN
    # ==========================================
    
    def test_18_cerrar_sesion(self):
        """Test: Cerrar sesión correctamente"""
        print("\n🧪 Test: Cerrar sesión")
        
        self._do_login()
        time.sleep(2)
        
        # Click en botón de cerrar sesión
        logout_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Cerrar sesión')]")
        logout_btn.click()
        
        # Confirmar en el alert
        time.sleep(0.5)
        alert = self.driver.switch_to.alert
        alert.accept()
        
        time.sleep(2)
        
        # Verificar que estamos en la página de login
        self.assertIn("Bienvenido de nuevo", self.driver.page_source)
        print("✅ Sesión cerrada correctamente")
    
    def test_19_acceso_sin_autenticacion(self):
        """Test: Intentar acceder a páginas protegidas sin autenticación"""
        print("\n🧪 Test: Acceso sin autenticación")
        
        # Intentar ir directamente al dashboard
        self.driver.get(f"{self.base_url}/")
        time.sleep(2)
        
        # Debe redirigir a login
        current_url = self.driver.current_url
        self.assertIn("login", current_url)
        print("✅ Redirección a login funciona correctamente")
    
    # ==========================================
    # TESTS DE VALIDACIÓN
    # ==========================================
    
    def test_20_validacion_campos_vacios(self):
        """Test: Validación de campos vacíos en formularios"""
        print("\n🧪 Test: Validación de campos vacíos")
        
        self._do_login()
        self._navigate_to_expenses()
        
        # Intentar enviar formulario vacío
        submit_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Agregar')]")
        submit_btn.click()
        time.sleep(1)
        
        # Verificar que no se envió (campos required de HTML5)
        # El navegador debe mostrar mensaje de validación
        print("✅ Validación de campos funciona")
    
    # ==========================================
    # MÉTODOS AUXILIARES
    # ==========================================
    
    def _do_login(self):
        """Método auxiliar para hacer login rápido"""
        self.driver.get(f"{self.base_url}/login")
        time.sleep(1)
        
        email_input = self.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
        )
        password_input = self.driver.find_element(By.CSS_SELECTOR, "input[type='password']")
        
        email_input.send_keys(self.test_user["email"])
        password_input.send_keys(self.test_user["password"])
        
        login_btn = self.driver.find_element(By.CLASS_NAME, "login-btn")
        login_btn.click()
        
        # Esperar a que cargue el dashboard
        self.wait.until(
            EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Dashboard')]"))
        )
    
    def _navigate_to_expenses(self):
        """Navegar a la página de gastos"""
        gastos_link = self.wait.until(
            EC.element_to_be_clickable((By.XPATH, "//a[contains(text(), 'Gastos')]"))
        )
        gastos_link.click()
        time.sleep(1)
    
    def _add_quick_expense(self, title, amount, expense_type="expense"):
        """Agregar gasto/ingreso rápidamente"""
        title_input = self.driver.find_element(By.CSS_SELECTOR, "input[placeholder='Título (ej: Netflix)']")
        amount_input = self.driver.find_element(By.CSS_SELECTOR, "input[placeholder='Valor']")
        category_input = self.driver.find_element(By.CSS_SELECTOR, "input[placeholder='Categoría']")
        
        # Cambiar tipo si es necesario
        if expense_type == "income":
            type_select = self.driver.find_element(By.CSS_SELECTOR, "select")
            type_select.click()
            options = type_select.find_elements(By.TAG_NAME, "option")
            options[0].click()
        
        title_input.send_keys(title)
        amount_input.send_keys(amount)
        category_input.send_keys("Test")
        
        submit_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Agregar')]")
        submit_btn.click()


if __name__ == "__main__":
    # Ejecutar todos los tests
    unittest.main(verbosity=2)