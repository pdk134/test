const app = getApp()

Page({
  data: {
    checkins: []
  },

  onShow() {
    this.loadRecords()
  },

  loadRecords() {
    wx.request({
      url: `${app.globalData.baseUrl}/api/checkins`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data.checkins) {
          const checkins = res.data.checkins.map((c) => ({
            ...c,
            timeText: this.formatTime(c.time),
            distanceText: this.formatDistance(c.distance_m)
          }))
          this.setData({ checkins })
        } else {
          wx.showToast({ title: '加载失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.showToast({ title: '加载失败，请确认后端已启动', icon: 'none' })
      }
    })
  },

  formatTime(t) {
    if (!t) return ''
    const d = new Date(t)
    const pad = (n) => (n < 10 ? '0' + n : '' + n)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  },

  formatDistance(m) {
    if (m === undefined || m === null) return ''
    if (m < 1000) return `${Math.round(m)} m`
    return `${(m / 1000).toFixed(2)} km`
  }
})
