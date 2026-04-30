
-- 1. Enum for roles
CREATE TYPE public.app_role AS ENUM ('contratante', 'motorista', 'admin');

-- 2. Enum for carga status
CREATE TYPE public.carga_status AS ENUM ('disponivel', 'em_andamento', 'concluida', 'cancelada');

-- 3. Enum for frete status
CREATE TYPE public.frete_status AS ENUM ('aceito', 'em_coleta', 'em_transito', 'entregue', 'cancelado');

-- 4. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT '',
  telefone TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  cidade TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. User roles table (separate from profiles per security guidelines)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- 6. Cargas table
CREATE TABLE public.cargas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contratante_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tipo_grao TEXT NOT NULL,
  quantidade NUMERIC NOT NULL DEFAULT 0,
  veiculo TEXT DEFAULT '',
  origem TEXT NOT NULL,
  destino TEXT NOT NULL,
  data_coleta DATE,
  valor NUMERIC NOT NULL DEFAULT 0,
  observacoes TEXT DEFAULT '',
  status carga_status NOT NULL DEFAULT 'disponivel',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Fretes table
CREATE TABLE public.fretes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carga_id UUID REFERENCES public.cargas(id) ON DELETE CASCADE NOT NULL,
  motorista_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status frete_status NOT NULL DEFAULT 'aceito',
  aceito_em TIMESTAMPTZ DEFAULT now(),
  coletado_em TIMESTAMPTZ,
  entregue_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Anuncios table
CREATE TABLE public.anuncios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  categoria TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT DEFAULT '',
  preco NUMERIC NOT NULL DEFAULT 0,
  unidade TEXT DEFAULT 'ton',
  quantidade NUMERIC DEFAULT 0,
  localizacao TEXT DEFAULT '',
  imagem_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Armazens table
CREATE TABLE public.armazens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  telefone TEXT DEFAULT '',
  avaliacao NUMERIC DEFAULT 0,
  capacidade TEXT DEFAULT '',
  cidade TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 11. Trigger function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 12. RLS policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- 13. RLS policies for user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 14. RLS policies for cargas
ALTER TABLE public.cargas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Contratantes can insert own cargas" ON public.cargas FOR INSERT WITH CHECK (auth.uid() = contratante_id);
CREATE POLICY "Contratantes can view own cargas" ON public.cargas FOR SELECT USING (auth.uid() = contratante_id);
CREATE POLICY "Contratantes can update own cargas" ON public.cargas FOR UPDATE USING (auth.uid() = contratante_id);
CREATE POLICY "Motoristas can view available cargas" ON public.cargas FOR SELECT USING (status = 'disponivel' AND public.has_role(auth.uid(), 'motorista'));
CREATE POLICY "Admins can manage all cargas" ON public.cargas FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 15. RLS policies for fretes
ALTER TABLE public.fretes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Motoristas can insert fretes" ON public.fretes FOR INSERT WITH CHECK (auth.uid() = motorista_id);
CREATE POLICY "Motoristas can view own fretes" ON public.fretes FOR SELECT USING (auth.uid() = motorista_id);
CREATE POLICY "Motoristas can update own fretes" ON public.fretes FOR UPDATE USING (auth.uid() = motorista_id);
CREATE POLICY "Contratantes can view fretes of own cargas" ON public.fretes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.cargas WHERE cargas.id = fretes.carga_id AND cargas.contratante_id = auth.uid())
);
CREATE POLICY "Admins can manage all fretes" ON public.fretes FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 16. RLS policies for anuncios
ALTER TABLE public.anuncios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view anuncios" ON public.anuncios FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert own anuncios" ON public.anuncios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own anuncios" ON public.anuncios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own anuncios" ON public.anuncios FOR DELETE USING (auth.uid() = user_id);

-- 17. RLS policies for armazens (public read, admin write)
ALTER TABLE public.armazens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view armazens" ON public.armazens FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage armazens" ON public.armazens FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 18. Insert role for new user via trigger (role passed in metadata)
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role app_role;
BEGIN
  _role := COALESCE(NEW.raw_user_meta_data->>'role', 'contratante')::app_role;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();
