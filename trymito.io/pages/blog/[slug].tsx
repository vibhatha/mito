
import { PostOrPage } from '@tryghost/content-api';
import Head from 'next/head';
import { GetStaticProps } from 'next/types';
import { useEffect } from 'react';
import DownloadCTACard from '../../components/CTACards/DownloadCTACard';
import Footer from '../../components/Footer/Footer';
import PageTOC from '../../components/Glossary/PageTOC/PageTOC';
import pageStyles from '../../styles/Page.module.css';
import postStyles from '../../styles/[slug].module.css';
import { getPosts, getSinglePost } from '../../utils/posts';
import { SLUG_REDIRECTS } from '../blog';
import Header from '../../components/Header/Header';

declare global {
  interface Window { Prism: any; }
}

// PostPage page component
const PostPage = (props: {post: PostOrPage}) => {
  // Render post title and content in the page from props

  useEffect(() => {
    window.Prism.highlightAll();
  }, []);

  if (!props.post.html) {
    return <div>Not found</div>
  }

  const authorName = props.post.primary_author?.name;
  const publishedAt = props.post.published_at && new Intl.DateTimeFormat('en-US').format(new Date(props.post.published_at));
  const readingTime = props.post.reading_time;

  return (
    <>
      {/* Standard Mito header - includes navigation for the website. */}
      <Head>
        <title>{props.post.title} | Mito </title>
        <meta
          name="description"
          content={props.post.meta_description || props.post.excerpt?.slice(0, 99)}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Header />
        
      {/* All blog post related content */}
      <main className={pageStyles.main}>
        <div className={postStyles.post}>

        {/* Blog Title Banner */}
        <div className={postStyles.post_title}>
            <div className={postStyles.post_metadata}>
              <p>
                { authorName ? 'By '+ props.post.primary_author?.name: 'The Mito Team' }
              </p>
              {publishedAt && <p style={{ marginLeft: '15px' }}> {publishedAt}</p>}
              {readingTime && <p style={{ marginLeft: '15px'}}>{readingTime} min read</p>}
            </div>
            <h1 style={{marginTop: '0'}}>{props.post.title}</h1>
          </div>

          {/* Table of Contents, post contents, and CTA */}
          <div style={{ display: 'flex', flexDirection: 'row', alignContent: 'space-between' }}>
            {/* Table of Contents */}
            <div className={postStyles.post_toc}>
              <PageTOC />
            </div>
            {/* Post Contents */}
            <div className={postStyles.post_content}>
                <div dangerouslySetInnerHTML={{ __html: props.post.html }} />
            </div>

            {/* CTA */}
            <div className={postStyles.post_cta}>
              <DownloadCTACard headerStyle={{ fontSize: '2rem', color: 'var(--color-light-background-accent)', fontWeight: 'normal' }} />
            </div>
          </div>
        </div>
        
        {/* Suggested Blogs */}
        <div className={postStyles.suggested_blogs_section}>
          <h1>More Like This</h1>
          <div className={postStyles.suggested_blogs_links}>
            { /* For each post, render a card with the post title and excerpt */}
            { ['','','','', '',''].map((value, index) => {
              return (
                <div key={index} className={postStyles.suggested_blog_card}>
                  <h2>Post Title</h2>
                  <p>Post Excerpt</p>
                </div>
              )
            }) }
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </main>
    </>
  )
}

export async function getStaticPaths() {
  const posts = await getPosts()

  if (!posts) {
    return {
      notFound: true,
    }
  }

  // Get the paths we want to create based on posts
  const paths = posts.map((post) => {
    return {
      params: { slug: post.slug },
    }
  }).concat(Object.keys(SLUG_REDIRECTS).map(key => {
    // Support all the new slug paths as well
    return {
      params: { slug: SLUG_REDIRECTS[key] },
    }
  }))

  // { fallback: false } means posts not found should 404.
  return { paths, fallback: false }
}


// Pass the page slug over to the "getSinglePost" function
// In turn passing it to the posts.read() to query the Ghost Content API
export const getStaticProps: GetStaticProps = async (context) => {
    const slug = context.params?.slug;

    // If the slug is in values of SLUG_REDIRECTS, get it's key for the slug
    // Otherwise, use the slug
    const slugToQuery = Object.keys(SLUG_REDIRECTS).find(key => SLUG_REDIRECTS[key] === slug) || slug;

    const post = slug && await getSinglePost(slugToQuery as string)

    if (!post) {
        return {
        notFound: true,
        }
    }

    return {
        props: { post }
    }
}

export default PostPage;