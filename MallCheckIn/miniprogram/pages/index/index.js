const app = getApp()

Page({
  data: {
    malls: [],
    locationText: '正在定位...',
    lat: null,
    lng: null,
    loading: false
  },

  onLoad() {
    this.getLocation()
  },

  onPullDownRefresh() {
    this.loadMalls()
  },

  getLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          lat: res.latitude,
          lng: res.longitude,
          locationText: `当前定位: ${res.latitude.toFixed(4)}, ${res.longitude.toFixed(4)}`
        })
        this.loadMalls()
      },
      fail: () => {
        this.setData({ locationText: '定位失败，请检查定位权限' })
        // 定位失败仍可加载商场（不排序）
        this.loadMalls()
      }
    })
  },

  loadMalls() {
    const { lat, lng } = this.data
    let url = `${app.globalData.baseUrl}/api/malls`
    if (lat !== null && lng !== null) {
      url += `?lat=${lat}&lng=${lng}`
    }
    this.setData({ loading: true })
    wx.request({
      url,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data.malls) {
          const malls = res.data.malls.map((m) => ({
            ...m,
            distanceText:
              m.distance_m !== undefined ? this.formatDistance(m.distance_m) : '距离未知'
          }))
          this.setData({ malls })
        } else {
          wx.showToast({ title: '后端返回异常', icon: 'none' })
        }
      },
      fail: () => {
        wx.showToast({ title: '请求失败，请确认后端已启动', icon: 'none' })
      },
      complete: () => {
        this.setData({ loading: false })
        wx.stopPullDownRefresh()
      }
    })
  },

  formatDistance(m) {
    if (m < 1000) return `${Math.round(m)} m`
    return `${(m / 1000).toFixed(2)} km`
  },

  onCheckin(e) {
    const id = e.currentTarget.dataset.id
    const mall = this.data.malls.find((m) => m.id === id)
    if (!mall) return

    const { lat, lng } = this.data
    if (lat === null || lng === null) {
      wx.showToast({ title: '请先授权定位', icon: 'none' })
      return
    }

    wx.showModal({
      title: '确认打卡',
      content: `距「${mall.name}」约 ${mall.distanceText}，确认打卡？`,
      success: (res) => {
        if (!res.confirm) return
        wx.request({
          url: `${app.globalData.baseUrl}/api/checkin`,
          method: 'POST',
          data: { mall_id: id, lat, lng },
          success: (r) => {
            if (r.statusCode === 201) {
              wx.showToast({ title: '打卡成功', icon: 'success' })
            } else {
              wx.showToast({
                title: (r.data && r.data.error) || '打卡失败',
                icon: 'none'
              })
            }
          },
          fail: () => {
            wx.showToast({ title: '打卡请求失败', icon: 'none' })
          }
        })
      }
    })
  },

  goRecords() {
    wx.navigateTo({ url: '/pages/records/records' })
  }
})
