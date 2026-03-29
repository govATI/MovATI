-- 1. Habilita a extensão para gerar IDs únicos (UUIDs) automaticamente
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Criação da tabela principal que armazenará os talentos
CREATE TABLE perfis_ati (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_publico TEXT NOT NULL,           
    orgao_atual TEXT NOT NULL,            
    tem_funcao TEXT NOT NULL,             
    orgao_destino TEXT,                   
    area TEXT,                            
    habilidades TEXT[],                   
    email_contato TEXT UNIQUE NOT NULL,   -- MUDANÇA: Adicionado UNIQUE para evitar duplicidade
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilita a segurança em nível de linha (Row Level Security)
ALTER TABLE perfis_ati ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS DE ACESSO
CREATE POLICY "Permitir leitura publica" ON perfis_ati FOR SELECT USING (true);
CREATE POLICY "Permitir insercao publica" ON perfis_ati FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualizacao publica" ON perfis_ati FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusao publica" ON perfis_ati FOR DELETE USING (true);