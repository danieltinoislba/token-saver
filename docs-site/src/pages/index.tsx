import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro">
            Começar
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Contexto proporcional à tarefa"
      description="Classificação de tarefas e roteamento econômico de modelos para clientes MCP.">
      <HomepageHeader />
      <main className={styles.summary}>
        <div className="container">
          <h2>Menos contexto desperdiçado. Capacidade quando realmente importa.</h2>
          <p>
            Classifique a tarefa, selecione o nível de modelo e escale somente
            quando as evidências exigirem — sem prender a solução a um cliente.
          </p>
        </div>
      </main>
    </Layout>
  );
}
