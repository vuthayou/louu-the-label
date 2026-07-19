import HeroImageManager from '../components/HeroImageManager'

function AdminHomepage() {
  return (
    <HeroImageManager
      settingId="hero"
      storagePrefix="site/hero"
      label="Homepage"
      objectPositionClass="object-[75%_15%]"
    />
  )
}

export default AdminHomepage
